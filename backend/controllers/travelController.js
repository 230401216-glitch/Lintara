const db = require("../config/db");

const isMitraOrAdmin = (role) => ["mitra", "admin"].includes(String(role || "").trim().toLowerCase());

const resolvePartnerProfileIdFromValue = async (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  const [byProfile] = await db.query("SELECT id FROM mitra_profiles WHERE id = ?", [numericValue]);
  if (byProfile.length > 0) {
    return byProfile[0].id;
  }

  const [byUser] = await db.query("SELECT id FROM mitra_profiles WHERE user_id = ?", [numericValue]);
  return byUser[0]?.id ?? null;
};

const resolvePartnerProfileId = async (req) => {
  const role = String(req.user?.role || "").trim().toLowerCase();

  if (role === "admin") {
    const explicitValue = req.body?.pt_id ?? req.body?.mitra_id ?? req.query?.ptId ?? req.query?.mitraId ?? null;
    if (explicitValue) {
      const resolved = await resolvePartnerProfileIdFromValue(explicitValue);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (req.user?.id) {
    const [rows] = await db.query("SELECT id FROM mitra_profiles WHERE user_id = ?", [req.user.id]);
    return rows[0]?.id ?? null;
  }

  return null;
};

const getEffectivePartnerIdForQuery = async (req) => {
  const requestedPartnerId = await resolvePartnerProfileIdFromValue(req.query?.ptId ?? req.query?.mitraId);
  const role = String(req.user?.role || "").trim().toLowerCase();

  if (role === "mitra") {
    const ownPartnerId = await resolvePartnerProfileId(req);
    if (!ownPartnerId) {
      return null;
    }

    if (requestedPartnerId && requestedPartnerId !== ownPartnerId) {
      return null;
    }

    return ownPartnerId;
  }

  if (requestedPartnerId) {
    return requestedPartnerId;
  }

  return null;
};

const getPartnerId = async (req) => {
  const role = String(req.user?.role || "").trim().toLowerCase();

  if (role === "admin") {
    const explicitValue = req.body?.pt_id ?? req.body?.mitra_id;
    if (explicitValue) {
      return resolvePartnerProfileIdFromValue(explicitValue);
    }
  }

  return resolvePartnerProfileId(req);
};

const getTravelOwnership = async (req, travelId) => {
  if (String(req.user?.role || "").trim().toLowerCase() === "admin") {
    return true;
  }

  const mitraProfileId = await resolvePartnerProfileId(req);
  if (!mitraProfileId) {
    return false;
  }

  const [rows] = await db.query("SELECT id FROM travels WHERE id = ? AND COALESCE(pt_id, mitra_id) = ?", [travelId, mitraProfileId]);
  return rows.length > 0;
};

// Get all travels
exports.getTravels = async (req, res) => {
  try {
    const params = [];
    let query =
      `SELECT t.*, m.nama_perusahaan 
       FROM travels t
       JOIN mitra_profiles m ON COALESCE(t.pt_id, t.mitra_id) = m.id
       WHERE t.status = 'aktif'`;

    const resolvedPartnerId = await getEffectivePartnerIdForQuery(req);
    if ((req.query?.mitraId || req.query?.ptId) && !resolvedPartnerId) {
      return res.json({
        success: true,
        data: [],
      });
    }
    if (resolvedPartnerId) {
      query += " AND COALESCE(t.pt_id, t.mitra_id) = ?";
      params.push(resolvedPartnerId);
    }

    const [travels] = await db.query(query, params);

    res.json({
      success: true,
      data: travels,
    });
  } catch (error) {
    console.error("Get travels error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Create travel/armada
exports.createTravel = async (req, res) => {
  try {
    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses membuat armada",
      });
    }

    const {
      nama_travel,
      deskripsi,
      ac,
      seat_layout,
      foto,
      nomor_kendaraan,
      jumlah_kursi,
    } = req.body;

    if (!nama_travel || !nomor_kendaraan || !jumlah_kursi) {
      return res.status(400).json({
        success: false,
        message: "Nama travel, nomor kendaraan, dan jumlah kursi harus diisi",
      });
    }

    const partnerId = await getPartnerId(req);

    if (!partnerId) {
      return res.status(400).json({
        success: false,
        message: "Profil mitra tidak ditemukan",
      });
    }

    const [result] = await db.query(
      `INSERT INTO travels
       (pt_id, mitra_id, nama_travel, deskripsi, ac, seat_layout, foto, status, nomor_kendaraan, jumlah_kursi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partnerId,
        partnerId,
        nama_travel,
        deskripsi || "",
        ac ? 1 : 0,
        seat_layout || "2-2",
        foto || "",
        "aktif",
        nomor_kendaraan,
        Number(jumlah_kursi),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Armada berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Create travel error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update travel/armada
exports.updateTravel = async (req, res) => {
  try {
    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses mengubah armada",
      });
    }

    const { id } = req.params;
    const isOwned = await getTravelOwnership(req, id);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: "Travel tidak sesuai dengan akun mitra",
      });
    }

    const fields = [];
    const values = [];

    const { nama_travel, deskripsi, ac, seat_layout, foto, nomor_kendaraan, jumlah_kursi, status } = req.body;

    if (nama_travel !== undefined) {
      fields.push("nama_travel = ?");
      values.push(nama_travel);
    }
    if (deskripsi !== undefined) {
      fields.push("deskripsi = ?");
      values.push(deskripsi);
    }
    if (ac !== undefined) {
      fields.push("ac = ?");
      values.push(ac ? 1 : 0);
    }
    if (seat_layout !== undefined) {
      fields.push("seat_layout = ?");
      values.push(seat_layout);
    }
    if (foto !== undefined) {
      fields.push("foto = ?");
      values.push(foto);
    }
    if (nomor_kendaraan !== undefined) {
      fields.push("nomor_kendaraan = ?");
      values.push(nomor_kendaraan);
    }
    if (jumlah_kursi !== undefined) {
      fields.push("jumlah_kursi = ?");
      values.push(Number(jumlah_kursi));
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diubah",
      });
    }

    values.push(id);
    await db.query(`UPDATE travels SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await db.query(
      `SELECT t.*, m.nama_perusahaan 
       FROM travels t
       JOIN mitra_profiles m ON COALESCE(t.pt_id, t.mitra_id) = m.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Armada berhasil diperbarui",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Update travel error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.uploadTravelPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const isOwned = await getTravelOwnership(req, id);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: "Travel tidak sesuai dengan akun mitra",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Foto armada tidak ditemukan",
      });
    }

    const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    await db.query("UPDATE travels SET foto = ? WHERE id = ?", [photoUrl, id]);

    const [updatedRows] = await db.query(
      `SELECT t.*, m.nama_perusahaan 
       FROM travels t
       JOIN mitra_profiles m ON COALESCE(t.pt_id, t.mitra_id) = m.id
       WHERE t.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Foto armada berhasil diunggah",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Upload travel photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get travel by ID
exports.getTravelById = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user?.role || "").trim().toLowerCase() === "mitra") {
      const isOwned = await getTravelOwnership(req, id);
      if (!isOwned) {
        return res.status(403).json({
          success: false,
          message: "Travel tidak sesuai dengan akun mitra",
        });
      }
    }

    const [travels] = await db.query(
      `SELECT t.*, m.nama_perusahaan 
       FROM travels t
       JOIN mitra_profiles m ON COALESCE(t.pt_id, t.mitra_id) = m.id
       WHERE t.id = ? AND t.status = 'aktif'`,
      [id]
    );

    if (travels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Travel tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: travels[0],
    });
  } catch (error) {
    console.error("Get travel by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get routes
exports.getRoutes = async (req, res) => {
  try {
    const { travelId } = req.query;

    let query = "SELECT r.* FROM routes r";
    const params = [];
    const filters = [];

    const resolvedPartnerId = await getEffectivePartnerIdForQuery(req);
    if ((req.query?.mitraId || req.query?.ptId) && !resolvedPartnerId) {
      return res.json({
        success: true,
        data: [],
      });
    }
    if (resolvedPartnerId) {
      query += " JOIN travels t ON r.travel_id = t.id";
      filters.push("COALESCE(t.pt_id, t.mitra_id) = ?");
      params.push(resolvedPartnerId);
    }

    if (travelId) {
      filters.push("r.travel_id = ?");
      params.push(travelId);
    }

    if (filters.length) {
      query += ` WHERE ${filters.join(" AND ")}`;
    }

    const [routes] = await db.query(query, params);

    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    console.error("Get routes error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Create route/tariff
exports.createRoute = async (req, res) => {
  try {
    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses membuat rute",
      });
    }

    const { travel_id, asal, tujuan, harga, durasi } = req.body;

    if (!travel_id || !asal || !tujuan || !harga) {
      return res.status(400).json({
        success: false,
        message: "Travel, asal, tujuan, dan harga harus diisi",
      });
    }

    if (String(req.user.role || "").toLowerCase() !== "admin") {
      const partnerProfileId = await resolvePartnerProfileId(req);
      const [travels] = await db.query(
        `SELECT id FROM travels WHERE id = ? AND COALESCE(pt_id, mitra_id) = ?`,
        [travel_id, partnerProfileId]
      );

      if (travels.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Travel tidak sesuai dengan akun mitra",
        });
      }
    }

    const [result] = await db.query(
      "INSERT INTO routes (travel_id, asal, tujuan, harga, durasi) VALUES (?, ?, ?, ?, ?)",
      [travel_id, asal, tujuan, Number(harga), durasi || ""]
    );

    res.status(201).json({
      success: true,
      message: "Rute dan harga berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Create route error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update route/tariff
exports.updateRoute = async (req, res) => {
  try {
    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses mengubah rute",
      });
    }

    const { id } = req.params;
    const { travel_id, asal, tujuan, harga, durasi } = req.body;

    if (String(req.user.role || "").toLowerCase() !== "admin") {
      const partnerProfileId = await resolvePartnerProfileId(req);
      const [routes] = await db.query(
        `SELECT r.id FROM routes r
         JOIN travels t ON r.travel_id = t.id
         WHERE r.id = ? AND COALESCE(t.pt_id, t.mitra_id) = ?`,
        [id, partnerProfileId]
      );
      if (routes.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Rute tidak sesuai dengan akun mitra",
        });
      }

      if (travel_id !== undefined) {
        const [travels] = await db.query("SELECT id FROM travels WHERE id = ? AND COALESCE(pt_id, mitra_id) = ?", [travel_id, partnerProfileId]);
        if (travels.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Travel tidak sesuai dengan akun mitra",
          });
        }
      }
    }

    const fields = [];
    const values = [];

    if (travel_id !== undefined) {
      fields.push("travel_id = ?");
      values.push(travel_id);
    }
    if (asal !== undefined) {
      fields.push("asal = ?");
      values.push(asal);
    }
    if (tujuan !== undefined) {
      fields.push("tujuan = ?");
      values.push(tujuan);
    }
    if (harga !== undefined) {
      fields.push("harga = ?");
      values.push(Number(harga));
    }
    if (durasi !== undefined) {
      fields.push("durasi = ?");
      values.push(durasi);
    }
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diubah",
      });
    }

    values.push(id);
    await db.query(`UPDATE routes SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await db.query("SELECT * FROM routes WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Rute berhasil diperbarui",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Update route error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get schedules
exports.getSchedules = async (req, res) => {
  try {
    const { routeId, date } = req.query;
    const params = [];

    const resolvedPartnerId = await getEffectivePartnerIdForQuery(req);
    if ((req.query?.mitraId || req.query?.ptId) && !resolvedPartnerId) {
      return res.json({
        success: true,
        data: [],
      });
    }

    let query = `SELECT s.*, r.asal, r.tujuan, r.harga 
                 FROM schedules s
                 JOIN routes r ON s.route_id = r.id`;

    if (resolvedPartnerId) {
      query += " JOIN travels t ON r.travel_id = t.id";
    }

    query += `
                 WHERE s.status = 'aktif'`;

    if (resolvedPartnerId) {
      query += " AND COALESCE(t.pt_id, t.mitra_id) = ?";
      params.push(resolvedPartnerId);
    }

    if (routeId) {
      query += " AND s.route_id = ?";
      params.push(routeId);
    }

    if (date) {
      query += " AND s.tanggal = ?";
      params.push(date);
    }

    query += " ORDER BY s.jam_berangkat ASC";

    const [schedules] = await db.query(query, params);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Create schedule
exports.createSchedule = async (req, res) => {
  try {
    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses membuat jadwal",
      });
    }

    const { route_id, tanggal, jam_berangkat, total_kursi } = req.body;

    if (!route_id || !tanggal || !jam_berangkat || !total_kursi) {
      return res.status(400).json({
        success: false,
        message: "Rute, tanggal, jam berangkat, dan total kursi harus diisi",
      });
    }

    if (String(req.user.role || "").toLowerCase() !== "admin") {
      const partnerProfileId = await resolvePartnerProfileId(req);
      const [routes] = await db.query(
        `SELECT r.id FROM routes r
         JOIN travels t ON r.travel_id = t.id
         WHERE r.id = ? AND COALESCE(t.pt_id, t.mitra_id) = ?`,
        [route_id, partnerProfileId]
      );

      if (routes.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Rute tidak sesuai dengan akun mitra",
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO schedules (route_id, tanggal, jam_berangkat, total_kursi, status)
       VALUES (?, ?, ?, ?, ?)`,
      [route_id, tanggal, jam_berangkat, Number(total_kursi), "aktif"]
    );

    res.status(201).json({
      success: true,
      message: "Jadwal berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses mengubah jadwal",
      });
    }

    const { id } = req.params;
    const { route_id, tanggal, jam_berangkat, total_kursi, status } = req.body;

    if (String(req.user.role || "").toLowerCase() !== "admin") {
      const partnerProfileId = await resolvePartnerProfileId(req);
      const [schedules] = await db.query(
        `SELECT s.id FROM schedules s
         JOIN routes r ON s.route_id = r.id
         JOIN travels t ON r.travel_id = t.id
         WHERE s.id = ? AND COALESCE(t.pt_id, t.mitra_id) = ?`,
        [id, partnerProfileId]
      );
      if (schedules.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Jadwal tidak sesuai dengan akun mitra",
        });
      }

      if (route_id !== undefined) {
        const [routes] = await db.query(
          `SELECT r.id FROM routes r
           JOIN travels t ON r.travel_id = t.id
           WHERE r.id = ? AND COALESCE(t.pt_id, t.mitra_id) = ?`,
          [route_id, partnerProfileId]
        );

        if (routes.length === 0) {
          return res.status(403).json({
            success: false,
            message: "Rute tidak sesuai dengan akun mitra",
          });
        }
      }
    }

    const fields = [];
    const values = [];

    if (route_id !== undefined) {
      fields.push("route_id = ?");
      values.push(route_id);
    }
    if (tanggal !== undefined) {
      fields.push("tanggal = ?");
      values.push(tanggal);
    }
    if (jam_berangkat !== undefined) {
      fields.push("jam_berangkat = ?");
      values.push(jam_berangkat);
    }
    if (total_kursi !== undefined) {
      fields.push("total_kursi = ?");
      values.push(Number(total_kursi));
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diubah",
      });
    }

    values.push(id);
    await db.query(`UPDATE schedules SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await db.query("SELECT * FROM schedules WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Jadwal berhasil diperbarui",
      data: updatedRows[0],
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get available seats for schedule
exports.getAvailableSeats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // Get total seats for schedule
    const [scheduleData] = await db.query(
      "SELECT total_kursi FROM schedules WHERE id = ?",
      [scheduleId]
    );

    if (scheduleData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Schedule tidak ditemukan",
      });
    }

    const totalSeats = scheduleData[0].total_kursi;

    // Get booked seats
    const [bookedSeats] = await db.query(
      `SELECT DISTINCT nomor_kursi FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.schedule_id = ? AND b.status_booking != 'cancelled'`,
      [scheduleId]
    );

    const bookedSeatNumbers = bookedSeats.map((seat) => seat.nomor_kursi);
    const availableSeats = [];

    for (let i = 1; i <= totalSeats; i++) {
      if (!bookedSeatNumbers.includes(i)) {
        availableSeats.push(i);
      }
    }

    res.json({
      success: true,
      total_kursi: totalSeats,
      booked_seats: bookedSeatNumbers,
      available_seats: availableSeats,
    });
  } catch (error) {
    console.error("Get available seats error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
