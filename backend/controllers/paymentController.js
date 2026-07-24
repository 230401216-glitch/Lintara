const db = require("../config/db");

const resolveMitraProfileIdFromUserId = async (userId) => {
  const numericUserId = Number(userId);
  if (Number.isNaN(numericUserId)) {
    return null;
  }

  const [byProfile] = await db.query("SELECT id FROM mitra_profiles WHERE id = ?", [numericUserId]);
  if (byProfile.length > 0) {
    return byProfile[0].id;
  }

  const [byUser] = await db.query("SELECT id FROM mitra_profiles WHERE user_id = ?", [numericUserId]);
  return byUser[0]?.id ?? null;
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = String(req.user.role || "").trim().toLowerCase();
    const { booking_id, payment_method } = req.body;

    if (!booking_id || !payment_method) {
      return res.status(400).json({
        success: false,
        message: "Booking ID dan payment method harus diisi",
      });
    }

    // Get booking
    let bookingQuery = "SELECT b.* FROM bookings b WHERE b.id = ? AND b.user_id = ?";
    let bookingParams = [booking_id, userId];

    if (role === "mitra") {
      const mitraProfileId = await resolveMitraProfileIdFromUserId(userId);
      if (!mitraProfileId) {
        return res.status(403).json({
          success: false,
          message: "Profil mitra tidak ditemukan",
        });
      }

      bookingQuery = `SELECT b.* FROM bookings b
        JOIN schedules s ON b.schedule_id = s.id
        JOIN routes r ON s.route_id = r.id
        JOIN travels t ON r.travel_id = t.id
        WHERE b.id = ? AND COALESCE(t.pt_id, t.mitra_id) = ?`;
      bookingParams = [booking_id, mitraProfileId];
    } else if (role === "admin") {
      bookingQuery = "SELECT b.* FROM bookings b WHERE b.id = ?";
      bookingParams = [booking_id];
    }

    const [bookings] = await db.query(bookingQuery, bookingParams);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking tidak ditemukan",
      });
    }

    const booking = bookings[0];

    // Check if already paid
    if (booking.status_pembayaran === "paid" || booking.payment_status === "LUNAS") {
      return res.status(400).json({
        success: false,
        message: "Booking sudah dibayar",
      });
    }

    // Start transaction for payment processing
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update payment status
      await connection.query(
        `UPDATE payments SET status = ?, paid_at = NOW() 
         WHERE booking_id = ?`,
        ["paid", booking_id]
      );

      // Update booking status
      await connection.query(
        `UPDATE bookings
         SET status_pembayaran = ?, status_booking = ?, payment_status = ?, approval_status = ?
         WHERE id = ?`,
        ["paid", "confirmed", "paid", "approved", booking_id]
      );

      await connection.commit();
      connection.release();

      // Get ticket info
      const [tickets] = await db.query(
        "SELECT * FROM tickets WHERE booking_id = ?",
        [booking_id]
      );

      res.json({
        success: true,
        message: "Pembayaran berhasil",
        data: {
          booking_id,
          status: "paid",
          ticket_code: tickets[0]?.kode_tiket,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const [payments] = await db.query(
      `SELECT p.* FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.id = ? AND b.user_id = ?`,
      [bookingId, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: payments[0],
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
