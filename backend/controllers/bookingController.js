const db = require("../config/db");

const resolveMitraProfileId = async (req) => {
  const role = String(req.user?.role || "").trim().toLowerCase();
  const explicitValue = role === "admin"
    ? req.query?.ptId ?? req.query?.mitraId ?? req.body?.pt_id ?? req.body?.mitra_id ?? null
    : null;

  if (explicitValue) {
    const numericValue = Number(explicitValue);
    if (!Number.isNaN(numericValue)) {
      const [byId] = await db.query("SELECT id FROM mitra_profiles WHERE id = ?", [numericValue]);
      if (byId.length > 0) {
        return numericValue;
      }

      const [byUser] = await db.query("SELECT id FROM mitra_profiles WHERE user_id = ?", [numericValue]);
      if (byUser.length > 0) {
        return byUser[0].id;
      }
    }
  }

  if (req.user?.id) {
    const [rows] = await db.query("SELECT id FROM mitra_profiles WHERE user_id = ?", [req.user.id]);
    return rows[0]?.id ?? null;
  }

  return null;
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      schedule_id,
      seats,
      nama_penumpang,
      no_hp_penumpang,
      lokasi_jemput,
      metode_pembayaran,
      tipe_bus,
    } = req.body;

    // Validation
    if (!schedule_id || !seats || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Schedule ID dan seats harus diisi",
      });
    }

    if (!nama_penumpang || !no_hp_penumpang) {
      return res.status(400).json({
        success: false,
        message: "Nama dan nomor HP penumpang harus diisi",
      });
    }

    if (!metode_pembayaran || !["cash", "qris"].includes(metode_pembayaran)) {
      return res.status(400).json({
        success: false,
        message: "Metode pembayaran tidak valid",
      });
    }

    // Get schedule and route info
    const [scheduleData] = await db.query(
      `SELECT s.*, r.harga FROM schedules s
       JOIN routes r ON s.route_id = r.id
       WHERE s.id = ? AND s.status = 'aktif'`,
      [schedule_id]
    );

    if (scheduleData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule tidak ditemukan",
      });
    }

    const schedule = scheduleData[0];
    const pricePerSeat = schedule.harga;
    const totalPrice = pricePerSeat * seats.length;
    const randomPart = Math.random().toString(36).slice(2, 11);
    const bookingCode = "BK" + Date.now() + randomPart;

    // Start transaction with seat availability check inside
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if seats are available (with lock to prevent race condition)
      const [bookedSeats] = await connection.query(
        `SELECT nomor_kursi FROM booking_seats bs
         JOIN bookings b ON bs.booking_id = b.id
         WHERE b.schedule_id = ? AND b.status_booking NOT IN ('dibatalkan', 'cancelled') AND nomor_kursi IN (?)
         FOR UPDATE`,
        [schedule_id, seats]
      );

      if (bookedSeats.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Beberapa kursi sudah dipesan",
        });
      }
      // Create booking
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings 
         (kode_booking, user_id, schedule_id, jumlah_tiket, total_harga, metode_pembayaran, 
          status_booking, status_pembayaran, nama_penumpang, no_hp_penumpang, lokasi_jemput, tipe_bus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingCode,
          userId,
          schedule_id,
          seats.length,
          totalPrice,
          metode_pembayaran,
          "pending",
          "pending",
          nama_penumpang,
          no_hp_penumpang,
          lokasi_jemput || null,
          tipe_bus || null,
        ]
      );

      const bookingId = bookingResult.insertId;

      // Insert booking seats
      for (const seat of seats) {
        await connection.query(
          "INSERT INTO booking_seats (booking_id, nomor_kursi) VALUES (?, ?)",
          [bookingId, seat]
        );
      }

      // Create ticket
      const ticketCode = "TK" + Date.now();
      await connection.query(
        `INSERT INTO tickets (booking_id, kode_tiket, status)
         VALUES (?, ?, ?)`,
        [bookingId, ticketCode, "aktif"]
      );

      await connection.query(
        `UPDATE bookings
         SET booking_code = ?, approval_status = ?, payment_status = ?, ticket_code = ?
         WHERE id = ?`,
        [bookingCode, "pending", "pending", ticketCode, bookingId]
      );

      // Create payment record (using correct lintara.sql field names)
      await connection.query(
        `INSERT INTO payments (booking_id, amount, metode, status)
         VALUES (?, ?, ?, ?)`,
        [bookingId, totalPrice, metode_pembayaran, "pending"]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Booking berhasil dibuat",
        data: {
          booking_id: bookingId,
          kode_booking: bookingCode,
          total_harga: totalPrice,
          metode_pembayaran,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get all bookings for mitra/admin
exports.getAllBookings = async (req, res) => {
  try {
    const isAdmin = String(req.user.role || "").trim().toLowerCase() === "admin";
    const params = [];

    let query = `SELECT b.*, r.asal, r.tujuan, r.harga, s.tanggal, s.jam_berangkat, s.total_kursi,
         tv.nama_travel AS travel_name, tv.mitra_id, tk.kode_tiket
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN routes r ON s.route_id = r.id
       LEFT JOIN travels tv ON r.travel_id = tv.id
       LEFT JOIN tickets tk ON b.id = tk.booking_id`;

    if (!isAdmin) {
      const mitraProfileId = await resolveMitraProfileId(req);
      if (!mitraProfileId) {
        return res.status(403).json({
          success: false,
          message: "Profil mitra tidak ditemukan",
        });
      }

      query += " WHERE COALESCE(tv.pt_id, tv.mitra_id) = ?";
      params.push(mitraProfileId);
    }

    query += " ORDER BY b.created_at DESC";

    const [bookings] = await db.query(query, params);

    for (const booking of bookings) {
      const [seats] = await db.query(
        "SELECT nomor_kursi FROM booking_seats WHERE booking_id = ?",
        [booking.id]
      );
      booking.seats = seats.map((s) => s.nomor_kursi);
    }

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [bookings] = await db.query(
      `SELECT b.*, r.asal, r.tujuan, s.tanggal, s.jam_berangkat, t.kode_tiket
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN routes r ON s.route_id = r.id
       LEFT JOIN tickets t ON b.id = t.booking_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    // Get seats for each booking
    for (const booking of bookings) {
      const [seats] = await db.query(
        "SELECT nomor_kursi FROM booking_seats WHERE booking_id = ?",
        [booking.id]
      );
      booking.seats = seats.map((s) => s.nomor_kursi);
    }

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const role = String(req.user.role || "").trim().toLowerCase();
    const params = [bookingId];
    let accessFilter = "b.user_id = ?";
    params.push(userId);

    if (role === "admin") {
      accessFilter = "1 = 1";
      params.splice(1, 1);
    } else if (role === "mitra") {
      const mitraProfileId = await resolveMitraProfileId(req);
      if (!mitraProfileId) {
        return res.status(403).json({
          success: false,
          message: "Profil mitra tidak ditemukan",
        });
      }

      accessFilter = "COALESCE(tv.pt_id, tv.mitra_id) = ?";
      params.splice(1, 1, mitraProfileId);
    }

    const [bookings] = await db.query(
      `SELECT b.*, r.asal, r.tujuan, s.tanggal, s.jam_berangkat, t.kode_tiket, p.status as payment_status,
        tv.nama_travel AS travel_name, tv.mitra_id
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN routes r ON s.route_id = r.id
       LEFT JOIN travels tv ON r.travel_id = tv.id
       LEFT JOIN tickets t ON b.id = t.booking_id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.id = ? AND ${accessFilter}`,
      params
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan",
      });
    }

    const booking = bookings[0];

    const [seats] = await db.query(
      "SELECT nomor_kursi FROM booking_seats WHERE booking_id = ?",
      [bookingId]
    );
    booking.seats = seats.map((s) => s.nomor_kursi);

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const role = String(req.user.role || "").trim().toLowerCase();
    const params = [bookingId];
    let query = "SELECT * FROM bookings WHERE id = ? AND user_id = ?";
    params.push(userId);

    if (role === "admin") {
      query = "SELECT * FROM bookings WHERE id = ?";
      params.splice(1, 1);
    } else if (role === "mitra") {
      const mitraProfileId = await resolveMitraProfileId(req);
      if (!mitraProfileId) {
        return res.status(403).json({
          success: false,
          message: "Profil mitra tidak ditemukan",
        });
      }

      query = `SELECT b.* FROM bookings b
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
        JOIN travels tv ON r.travel_id = tv.id
        WHERE b.id = ? AND COALESCE(tv.pt_id, tv.mitra_id) = ?`;
      params.splice(1, 1, mitraProfileId);
    }

    const [bookings] = await db.query(query, params);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan",
      });
    }

    const booking = bookings[0];

    if (booking.status_booking === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking sudah dibatalkan",
      });
    }

    await db.query(
      "UPDATE bookings SET status_booking = ? WHERE id = ?",
      ["cancelled", bookingId]
    );

    res.json({
      success: true,
      message: "Booking berhasil dibatalkan",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.scanTicket = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { code, lokasi } = req.body;
    const role = String(req.user.role || "").trim().toLowerCase();

    if (!code || !String(code).trim()) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Kode tiket harus diisi",
      });
    }

    const normalizedCode = String(code).trim();
    const params = [normalizedCode, normalizedCode, normalizedCode, normalizedCode];
    let query = `SELECT tk.id AS ticket_id, tk.kode_tiket, tk.status AS ticket_status,
          b.id AS booking_id, b.kode_booking, b.booking_code, b.nama_penumpang,
          b.no_hp_penumpang, b.status_booking, b.status_pembayaran,
          r.asal, r.tujuan, s.tanggal, s.jam_berangkat, tv.nama_travel, tv.mitra_id
        FROM tickets tk
        JOIN bookings b ON tk.booking_id = b.id
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
        JOIN travels tv ON r.travel_id = tv.id
        WHERE (tk.kode_tiket = ? OR b.kode_booking = ? OR b.booking_code = ? OR b.id = ?)`;

    if (role === "mitra") {
      const mitraProfileId = await resolveMitraProfileId(req);
      if (!mitraProfileId) {
        connection.release();
        return res.status(403).json({
          success: false,
          message: "Profil mitra tidak ditemukan",
        });
      }

      query += " AND COALESCE(tv.pt_id, tv.mitra_id) = ?";
      params.push(mitraProfileId);
    }

    const [tickets] = await connection.query(query, params);
    const ticket = tickets[0];

    if (ticket.status_pembayaran !== "paid" || ticket.status_booking !== "confirmed") {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Tiket belum aktif karena booking atau pembayaran belum terkonfirmasi",
      });
    }

    if (ticket.ticket_status === "digunakan") {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Tiket sudah pernah digunakan",
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "UPDATE tickets SET status = ?, scanned_at = NOW() WHERE id = ?",
      ["digunakan", ticket.ticket_id]
    );

    await connection.query(
      "INSERT INTO ticket_scans (ticket_id, scanned_by, lokasi) VALUES (?, ?, ?)",
      [ticket.ticket_id, req.user.id, lokasi || null]
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: "Tiket berhasil diverifikasi",
      data: ticket,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Scan ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
