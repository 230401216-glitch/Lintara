const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("node:https");
const { OAuth2Client } = require("google-auth-library");

// OAuth2Client can be created without initial client id; we'll validate audience against allowed IDs
const client = new OAuth2Client();

const getAllowedGoogleClientIds = () => {
  return [
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID,
    // Support EXPO_PUBLIC_ env vars which may be present in the repo root .env
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  ].filter(Boolean);
};

// Validation helper
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone) => {
  return /^(\+62|0)\d{8,12}$/.test(phone.replace(/\s/g, ""));
};

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();

  if (["mitra", "partner", "vendor"].includes(value)) {
    return "mitra";
  }

  if (["admin", "administrator", "superadmin"].includes(value)) {
    return "admin";
  }

  return "user";
};

const publicUserFields = `
  u.id,
  u.nama,
  u.email,
  u.no_hp,
  u.role,
  u.status,
  u.foto,
  m.id AS mitra_profile_id,
  m.nama_perusahaan,
  m.status_verifikasi,
  m.official_document_url,
  m.document_status
`;

const buildResponseFromHttps = (response, body) => ({
  ok: response.statusCode >= 200 && response.statusCode < 300,
  status: response.statusCode,
  json: async () => JSON.parse(body),
});

const handleHttpsRequest = (resolve) => {
  return (response) => {
    let body = "";

    response.on("data", (chunk) => {
      body += chunk;
    });

    response.on("end", () => {
      resolve(buildResponseFromHttps(response, body));
    });
  };
};

const fetchJson = (url, options = {}) => {
  if (typeof fetch === "function") {
    return fetch(url, options);
  }

  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const request = https.request(
      url,
      requestOptions,
      handleHttpsRequest(resolve)
    );

    request.on("error", reject);

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
};
exports.register = async (req, res) => {
  try {
    const { nama, email, no_hp, password, role, nama_perusahaan, alamat } = req.body;

    if (!nama || !email || !no_hp || !password) {
      return res.status(400).json({
        success: false,
        message: "Semua field harus diisi",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid",
      });
    }

    if (!validatePhone(no_hp)) {
      return res.status(400).json({
        success: false,
        message: "Nomor HP tidak valid. Gunakan format 62xxx atau 0xxx",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    const normalizedRole = normalizeRole(role);

    const status = "aktif";
    
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (nama, email, no_hp, password, role, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama, email, no_hp, hashedPassword, normalizedRole, status]
    );

    if (normalizedRole === "mitra") {
      await db.query(
        `INSERT INTO mitra_profiles (user_id, nama_perusahaan, alamat, status_verifikasi, saldo)
         VALUES (?, ?, ?, ?, ?)` ,
        [result.insertId, nama_perusahaan || `${nama} Travel`, alamat || "", "pending", 0]
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      { id: result.insertId, role: normalizedRole, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: result.insertId,
        nama,
        email,
        no_hp: no_hp || "",
        role: normalizedRole,
        status,
        foto: "",
        provider: "email",
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi",
      });
    }

    // Find user
    const [users] = await db.query(
      `SELECT u.id, u.nama, u.email, u.no_hp, u.password, u.role, u.status, u.foto,
        m.status_verifikasi, m.official_document_url, m.document_status
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Password salah",
      });
    }

    if (user.role === "mitra" && user.status_verifikasi === "pending") {
      return res.status(403).json({
        success: false,
        message: "Akun Mitra Anda masih menunggu persetujuan Admin.",
      });
    }

    if (user.role === "mitra" && user.status_verifikasi === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Pendaftaran akun Mitra Anda ditolak Admin.",
      });
    }

    // Check if user is active
    if (user.status === "nonaktif") {
      return res.status(403).json({
        success: false,
        message: "Akun telah dinonaktifkan Admin.",
      });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("[AUTH] JWT generated for user:", { id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        no_hp: user.no_hp,
        role: user.role,
        status: user.status,
        foto: user.foto,
        provider: "email",
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [rows] = await db.query(
      `SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.status, u.foto, m.nama_perusahaan, m.status_verifikasi, m.official_document_url, m.document_status
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Profil tidak ditemukan" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get my profile error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { nama, no_hp, nama_perusahaan, alamat } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!nama || !no_hp) {
      return res.status(400).json({ success: false, message: "Nama dan nomor HP wajib diisi" });
    }

    await db.query("UPDATE users SET nama = ?, no_hp = ? WHERE id = ?", [nama, no_hp, userId]);

    const [userRows] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);
    const role = userRows[0]?.role;

    if (role === "mitra") {
      await db.query(
        "INSERT INTO mitra_profiles (user_id, nama_perusahaan, alamat, status_verifikasi, saldo) VALUES (?, ?, ?, 'pending', 0) ON DUPLICATE KEY UPDATE nama_perusahaan = VALUES(nama_perusahaan), alamat = VALUES(alamat)",
        [userId, nama_perusahaan || "", alamat || ""]
      );
    }

    res.json({ success: true, message: "Profil berhasil diperbarui" });
  } catch (error) {
    console.error("Update my profile error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.applyMitra = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { nama_perusahaan, alamat } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!nama_perusahaan) {
      return res.status(400).json({ success: false, message: "Nama perusahaan wajib diisi" });
    }

    const [rows] = await db.query("SELECT id, role FROM users WHERE id = ?", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    await db.query(
      `INSERT INTO mitra_profiles (user_id, nama_perusahaan, alamat, status_verifikasi, saldo)
       VALUES (?, ?, ?, 'pending', 0)
       ON DUPLICATE KEY UPDATE nama_perusahaan = VALUES(nama_perusahaan), alamat = VALUES(alamat), status_verifikasi = 'pending'`,
      [userId, nama_perusahaan, alamat || ""]
    );

    await db.query("UPDATE users SET role = 'user' WHERE id = ?", [userId]);

    res.json({
      success: true,
      message: "Pengajuan mitra berhasil dikirim. Status Anda saat ini: Menunggu Verifikasi Admin.",
      data: { status_verifikasi: "pending" },
    });
  } catch (error) {
    console.error("Apply mitra error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getPendingMitras = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${publicUserFields}
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       WHERE m.status_verifikasi = 'pending'
       ORDER BY u.created_at ASC`
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get pending mitras error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.approveMitra = async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.query(
      "UPDATE users SET role = 'mitra', status = 'aktif' WHERE id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Akun mitra tidak ditemukan",
      });
    }

    await db.query(
      "UPDATE mitra_profiles SET status_verifikasi = 'verified' WHERE user_id = ?",
      [userId]
    );

    const [rows] = await db.query(
      `SELECT ${publicUserFields}
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: "Akun mitra berhasil dikonfirmasi",
      data: rows[0],
    });
  } catch (error) {
    console.error("Approve mitra error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.rejectMitra = async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.query(
      "UPDATE users SET status = 'aktif' WHERE id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Akun mitra tidak ditemukan",
      });
    }

    await db.query(
      "UPDATE mitra_profiles SET status_verifikasi = 'rejected' WHERE user_id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: "Akun mitra ditolak",
    });
  } catch (error) {
    console.error("Reject mitra error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const [[usersCount]] = await db.query(
      "SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'"
    );
    const [[mitrasCount]] = await db.query(
      "SELECT COUNT(*) AS total_mitras FROM users WHERE role = 'mitra'"
    );
    const [[bookingsCount]] = await db.query(
      "SELECT COUNT(*) AS total_bookings, COALESCE(SUM(total_harga), 0) AS total_revenue FROM bookings"
    );
    const [[mitraPending]] = await db.query(
      "SELECT COUNT(*) AS pending_mitras FROM mitra_profiles WHERE status_verifikasi = 'pending'"
    );
    const [[mitraVerified]] = await db.query(
      "SELECT COUNT(*) AS verified_mitras FROM mitra_profiles WHERE status_verifikasi = 'verified'"
    );
    const [[mitraRejected]] = await db.query(
      "SELECT COUNT(*) AS rejected_mitras FROM mitra_profiles WHERE status_verifikasi = 'rejected'"
    );
    const [[docSubmitted]] = await db.query(
      "SELECT COUNT(*) AS submitted_documents FROM mitra_profiles WHERE document_status = 'submitted'"
    );
    const [[docApproved]] = await db.query(
      "SELECT COUNT(*) AS approved_documents FROM mitra_profiles WHERE document_status = 'approved'"
    );
    const [[docRejected]] = await db.query(
      "SELECT COUNT(*) AS rejected_documents FROM mitra_profiles WHERE document_status = 'rejected'"
    );

    const [latestUsers] = await db.query(
      `SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.status, m.nama_perusahaan,
        m.status_verifikasi, m.document_status
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       ORDER BY u.id DESC`
    );

    const [submittedDocumentMitras] = await db.query(
      `SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.status, m.nama_perusahaan,
        m.status_verifikasi, m.official_document_url, m.document_status
       FROM users u
       JOIN mitra_profiles m ON m.user_id = u.id
       WHERE m.document_status = 'submitted'
       ORDER BY u.id DESC`
    );

    res.json({
      success: true,
      data: {
        totalUsers: Number(usersCount.total_users || 0),
        totalMitras: Number(mitrasCount.total_mitras || 0),
        totalBookings: Number(bookingsCount.total_bookings || 0),
        totalRevenue: Number(bookingsCount.total_revenue || 0),
        pendingMitras: Number(mitraPending.pending_mitras || 0),
        verifiedMitras: Number(mitraVerified.verified_mitras || 0),
        rejectedMitras: Number(mitraRejected.rejected_mitras || 0),
        submittedDocuments: Number(docSubmitted.submitted_documents || 0),
        approvedDocuments: Number(docApproved.approved_documents || 0),
        rejectedDocuments: Number(docRejected.rejected_documents || 0),
        latestUsers,
        submittedDocumentMitras,
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getMitraProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [rows] = await db.query(
      `SELECT ${publicUserFields}
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       WHERE u.id = ? AND u.role = 'mitra'`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profil mitra tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get mitra profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.uploadMitraDocument = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        success: false,
        message: "Dokumen tidak ditemukan",
      });
    }

    const documentUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    await db.query(
      "UPDATE mitra_profiles SET official_document_url = ?, document_status = 'submitted' WHERE user_id = ?",
      [documentUrl, userId]
    );

    res.json({
      success: true,
      message: "Dokumen resmi berhasil diunggah",
      data: {
        official_document_url: documentUrl,
        document_status: "submitted",
      },
    });
  } catch (error) {
    console.error("Upload mitra document error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.approveMitraDocument = async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.query(
      "UPDATE mitra_profiles SET document_status = 'approved' WHERE user_id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Profil mitra tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Dokumen mitra berhasil disetujui",
    });
  } catch (error) {
    console.error("Approve mitra document error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.rejectMitraDocument = async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.query(
      "UPDATE mitra_profiles SET document_status = 'rejected' WHERE user_id = ?",
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Profil mitra tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Dokumen mitra ditolak",
    });
  } catch (error) {
    console.error("Reject mitra document error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// -------------------------
// Admin: User management
// -------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.status, u.foto, m.nama_perusahaan, m.status_verifikasi
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       ORDER BY u.id DESC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.status, u.foto,
        m.nama_perusahaan, m.status_verifikasi, m.official_document_url, m.document_status
       FROM users u
       LEFT JOIN mitra_profiles m ON m.user_id = u.id
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, no_hp, role, status } = req.body;

    const [result] = await db.query(
      "UPDATE users SET nama = COALESCE(?, nama), email = COALESCE(?, email), no_hp = COALESCE(?, no_hp), role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?",
      [nama || null, email || null, no_hp || null, role || null, status || null, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });

    const [rows] = await db.query("SELECT id, nama, email, no_hp, role, status, foto FROM users WHERE id = ?", [id]);
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove mitra profile first if exists
    await db.query("DELETE FROM mitra_profiles WHERE user_id = ?", [id]);
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateMitraPhoto = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        success: false,
        message: "Foto mitra tidak ditemukan",
      });
    }

    const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    await db.query("UPDATE users SET foto = ? WHERE id = ?", [photoUrl, userId]);

    res.json({
      success: true,
      message: "Foto berhasil diunggah",
      photo: photoUrl,
    });
  } catch (error) {
    console.error("Update mitra photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.updateMyPhoto = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log("[updateMyPhoto] headers:", req.headers);
    console.log("[updateMyPhoto] userId:", userId);
    console.log("[updateMyPhoto] file:", req.file);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        success: false,
        message: "Foto tidak ditemukan",
      });
    }

    const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    await db.query("UPDATE users SET foto = ? WHERE id = ?", [photoUrl, userId]);

    res.json({
      success: true,
      message: "Foto berhasil diunggah",
      photo: photoUrl,
    });
  } catch (error) {
    console.error("Update my photo error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Field password wajib diisi" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Password baru minimal 6 karakter" });

    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

    const hashed = rows[0].password;
    const match = await bcrypt.compare(currentPassword, hashed);
    if (!match) return res.status(400).json({ success: false, message: "Password saat ini salah" });

    const newHashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [newHashed, userId]);

    res.json({ success: true, message: "Password berhasil diperbarui" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Google Login Handler
exports.googleLogin = async (req, res) => {
  try {
    console.log("[AUTH] === GOOGLE LOGIN REQUEST START ===");
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
      console.warn("[AUTH] No tokens received from client");
      return res.status(400).json({
        success: false,
        message: "Token Google harus dikirim",
      });
    }

    console.log("[AUTH] ID Token present:", !!idToken);
    console.log("[AUTH] Access Token present:", !!accessToken);

    let googleUser;

   if (idToken) {
  console.log("[AUTH] Verifying ID Token...");
  try {
    const allowedAudiences = getAllowedGoogleClientIds();
    if (allowedAudiences.length === 0) {
      console.warn("[AUTH] No allowed Google client IDs configured in environment variables");
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: allowedAudiences.length > 0 ? allowedAudiences : undefined,
    });

    const payload = ticket.getPayload();
    console.log("[AUTH] ID Token verified successfully");
    console.log("[AUTH] Token issuer:", payload?.iss);
    console.log("[AUTH] Token audience:", payload?.aud);
    console.log("[AUTH] Allowed audiences:", allowedAudiences);

    if (!payload) {
      console.warn("[AUTH] Token payload is null");
      return res.status(401).json({
        success: false,
        message: "Token Google tidak valid",
      });
    }

    googleUser = payload;

    // Validate audience explicitly in case payload.aud is an array or string
    const aud = payload.aud;
    const audMatches = (() => {
      if (!aud) return false;
      if (Array.isArray(aud)) {
        return aud.some((a) => getAllowedGoogleClientIds().includes(a));
      }
      return getAllowedGoogleClientIds().includes(aud);
    })();

    if (getAllowedGoogleClientIds().length > 0 && !audMatches) {
      console.warn("[AUTH] Audience mismatch:", { expected: getAllowedGoogleClientIds(), received: aud });
      return res.status(401).json({ success: false, message: "Google Client ID tidak cocok" });
    }
  } catch (error) {
    console.error("[AUTH] ID Token verification failed:", error?.message || error);
    return res.status(401).json({
      success: false,
      message: "Token Google tidak valid atau sudah kedaluwarsa",
      error: error?.message || String(error),
    });
  }
}
    else {
      const googleResponse = await fetchJson(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!googleResponse.ok) {
        return res.status(401).json({
          success: false,
          message: "Token Google tidak valid atau sudah kedaluwarsa",
        });
      }

      googleUser = await googleResponse.json();
    }

    const nama = googleUser.name;
    const email = googleUser.email;
    const photo = googleUser.picture || googleUser.avatar_url || null;
    const emailVerified = googleUser.email_verified === "true" || googleUser.email_verified === true;

    if (!nama || !email || !emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Akun Google harus memiliki email yang terverifikasi",
      });
    }

    // Check if user exists
    const [existingUsers] = await db.query(
      "SELECT id, nama, email, no_hp, role, status, foto FROM users WHERE email = ?",
      [email]
    );

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];

      if (user.status === "nonaktif") {
        return res.status(403).json({
          success: false,
          message: "Akun Anda telah dinonaktifkan. Hubungi admin.",
        });
      }

      if (user.role === "mitra") {
        const [mitraRows] = await db.query(
          "SELECT status_verifikasi FROM mitra_profiles WHERE user_id = ?",
          [user.id]
        );

        const mitraStatus = mitraRows[0]?.status_verifikasi;

        if (mitraStatus === "pending") {
          return res.status(403).json({
            success: false,
            message: "Akun Mitra Anda masih menunggu persetujuan Admin.",
          });
        }

        if (mitraStatus === "rejected") {
          return res.status(403).json({
            success: false,
            message: "Pendaftaran akun Mitra Anda ditolak Admin.",
          });
        }
      }

      // Update user info and track Google ID
      await db.query(
        "UPDATE users SET nama = ?, foto = ?, provider = 'google', google_id = ?, last_login = NOW() WHERE id = ?",
        [nama, photo, googleUser.sub, user.id]
      );
      user.nama = nama;
      user.foto = photo;
    } else {
      // Create new user with Google provider
      const [result] = await db.query(
        `INSERT INTO users (nama, email, no_hp, password, role, status, foto, provider, google_id, last_login) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          nama, 
          email, 
          "", 
          bcrypt.hashSync("google_" + Date.now(), 10), 
          "user", 
          "aktif", 
          photo,
          "google",
          googleUser.sub
        ]
      );
      user = {
        id: result.insertId,
        nama,
        email,
        no_hp: "",
        role: "user",
        status: "aktif",
        foto: photo,
      };
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined in .env");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        no_hp: user.no_hp || "",
        role: user.role,
        status: user.status,
        foto: user.foto,
        provider: "google",
        token,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
