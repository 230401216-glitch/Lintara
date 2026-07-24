const bcrypt = require("bcryptjs");
const db = require("./config/db");

const ensureSchema = async () => {
  const statements = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      no_hp VARCHAR(20) DEFAULT NULL,
      role ENUM('admin','mitra','user') NOT NULL DEFAULT 'user',
      status ENUM('aktif','nonaktif') DEFAULT 'aktif',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      foto VARCHAR(255) DEFAULT NULL,
      alamat TEXT DEFAULT NULL
    )`,

    // Mitra profiles table
    `CREATE TABLE IF NOT EXISTS mitra_profiles (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      nama_perusahaan VARCHAR(150) NOT NULL,
      alamat TEXT DEFAULT NULL,
      rekening VARCHAR(50) DEFAULT NULL,
      nama_bank VARCHAR(50) DEFAULT NULL,
      qris_image VARCHAR(255) DEFAULT NULL,
      npwp VARCHAR(50) DEFAULT NULL,
      status_verifikasi ENUM('pending','verified','rejected') DEFAULT 'pending',
      official_document_url VARCHAR(255) DEFAULT NULL,
      document_status ENUM('pending','submitted','approved','rejected') DEFAULT 'pending',
      saldo BIGINT DEFAULT 0,
      nama_pemilik VARCHAR(150) DEFAULT NULL,
      qris_string TEXT DEFAULT NULL
    )`,

    // Ensure document metadata columns exist for existing installations
    `ALTER TABLE mitra_profiles ADD COLUMN IF NOT EXISTS official_document_url VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE mitra_profiles ADD COLUMN IF NOT EXISTS document_status ENUM('pending','submitted','approved','rejected') DEFAULT 'pending'`,
    "ALTER TABLE travels ADD COLUMN IF NOT EXISTS pt_id BIGINT DEFAULT NULL",
    "UPDATE travels SET pt_id = mitra_id WHERE pt_id IS NULL AND mitra_id IS NOT NULL",

    // Travels/Armada table
    `CREATE TABLE IF NOT EXISTS travels (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      pt_id BIGINT DEFAULT NULL,
      mitra_id BIGINT NOT NULL,
      nama_travel VARCHAR(150) NOT NULL,
      deskripsi TEXT DEFAULT NULL,
      ac TINYINT(1) DEFAULT 1,
      seat_layout VARCHAR(20) DEFAULT NULL,
      foto VARCHAR(255) DEFAULT NULL,
      status ENUM('aktif','nonaktif') DEFAULT 'aktif',
      nomor_kendaraan VARCHAR(30) DEFAULT NULL,
      jumlah_kursi INT DEFAULT 20
    )`,

    // Routes table
    `CREATE TABLE IF NOT EXISTS routes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      travel_id BIGINT NOT NULL,
      asal VARCHAR(100) NOT NULL,
      tujuan VARCHAR(100) NOT NULL,
      harga INT NOT NULL,
      durasi VARCHAR(50) DEFAULT NULL
    )`,

    // Schedules table
    `CREATE TABLE IF NOT EXISTS schedules (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      route_id BIGINT NOT NULL,
      tanggal DATE NOT NULL,
      jam_berangkat TIME NOT NULL,
      total_kursi INT DEFAULT 20,
      status ENUM('aktif','selesai','dibatalkan') DEFAULT 'aktif',
      kursi_terisi INT DEFAULT 0
    )`,

    // Drivers table
    `CREATE TABLE IF NOT EXISTS drivers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mitra_id INT NOT NULL,
      nama_supir VARCHAR(100) NOT NULL,
      nomor_hp VARCHAR(30) DEFAULT '',
      plat_kendaraan VARCHAR(30) DEFAULT '',
      status VARCHAR(20) DEFAULT 'aktif',
      catatan TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    // Bookings table
    `CREATE TABLE IF NOT EXISTS bookings (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      kode_booking VARCHAR(50) DEFAULT NULL,
      user_id BIGINT NOT NULL,
      schedule_id BIGINT NOT NULL,
      jumlah_tiket INT NOT NULL,
      total_harga BIGINT NOT NULL,
      metode_pembayaran ENUM('cash','qris') NOT NULL,
      status_booking ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
      status_pembayaran ENUM('pending','paid','failed') DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lokasi_jemput TEXT DEFAULT NULL,
      tipe_bus ENUM('AC','NON_AC') DEFAULT NULL,
      nama_penumpang VARCHAR(100) DEFAULT NULL,
      no_hp_penumpang VARCHAR(20) DEFAULT NULL,
      booking_code VARCHAR(50) DEFAULT NULL,
      approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
      payment_status ENUM('pending','paid','unpaid') DEFAULT 'pending',
      ticket_code VARCHAR(30) DEFAULT NULL
    )`,

    // Booking seats table
    `CREATE TABLE IF NOT EXISTS booking_seats (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      booking_id BIGINT NOT NULL,
      nomor_kursi INT NOT NULL,
      status ENUM('BOOKED','CHECKED_IN','CANCELLED') DEFAULT 'BOOKED'
    )`,

    // Tickets table
    `CREATE TABLE IF NOT EXISTS tickets (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      booking_id BIGINT NOT NULL,
      kode_tiket VARCHAR(100) DEFAULT NULL,
      qr_data TEXT DEFAULT NULL,
      status ENUM('aktif','digunakan','expired') DEFAULT 'aktif',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      scanned_at DATETIME DEFAULT NULL
    )`,

    // Payments table
    `CREATE TABLE IF NOT EXISTS payments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      booking_id BIGINT NOT NULL,
      amount BIGINT NOT NULL,
      metode ENUM('cash','qris') NOT NULL,
      payment_reference VARCHAR(100) DEFAULT NULL,
      status ENUM('pending','paid','failed') DEFAULT 'pending',
      paid_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      mitra_id BIGINT DEFAULT NULL,
      invoice_number VARCHAR(100) DEFAULT NULL
    )`,

    // Ticket scans table
    `CREATE TABLE IF NOT EXISTS ticket_scans (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ticket_id BIGINT NOT NULL,
      scanned_by BIGINT NOT NULL,
      scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      lokasi VARCHAR(255) DEFAULT NULL
    )`,

    // Activity logs table
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT DEFAULT NULL,
      aktivitas TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    // Banners table
    `CREATE TABLE IF NOT EXISTS banners (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) DEFAULT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      judul VARCHAR(100) DEFAULT NULL,
      pesan TEXT DEFAULT NULL,
      dibaca TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    // Reviews table
    `CREATE TABLE IF NOT EXISTS reviews (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      booking_id BIGINT DEFAULT NULL,
      user_id BIGINT DEFAULT NULL,
      travel_id BIGINT DEFAULT NULL,
      rating INT DEFAULT NULL,
      komentar TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(100) DEFAULT NULL,
      nilai TEXT DEFAULT NULL
    )`,

    // Wallet transactions table
    `CREATE TABLE IF NOT EXISTS wallet_transactions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      mitra_id BIGINT DEFAULT NULL,
      tipe ENUM('PEMASUKAN','PENARIKAN') DEFAULT NULL,
      nominal DECIMAL(15,2) DEFAULT NULL,
      keterangan TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    // Withdrawals table
    `CREATE TABLE IF NOT EXISTS withdrawals (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      mitra_id BIGINT NOT NULL,
      amount BIGINT NOT NULL,
      rekening VARCHAR(100) DEFAULT NULL,
      status ENUM('pending','approved','rejected','paid') DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (error) {
      console.warn(`Warning creating table:`, error.message);
    }
  }

  try {
    await db.query(
      "UPDATE users SET status = 'aktif' WHERE status = 'pending'"
    );
    await db.query(
      "ALTER TABLE users MODIFY status ENUM('aktif','nonaktif') DEFAULT 'aktif'"
    );
  } catch (error) {
    console.warn("Warning updating users.status enum:", error.message);
  }

  const schemaMigrations = [
    "ALTER TABLE wallet_transactions ADD COLUMN tipe ENUM('PEMASUKAN','PENARIKAN') DEFAULT NULL",
    "ALTER TABLE wallet_transactions ADD COLUMN nominal DECIMAL(15,2) DEFAULT NULL",
    "ALTER TABLE wallet_transactions ADD COLUMN keterangan TEXT DEFAULT NULL",
    "UPDATE wallet_transactions SET nominal = amount WHERE nominal IS NULL AND amount IS NOT NULL",
    "UPDATE wallet_transactions SET tipe = CASE WHEN type = 'debit' THEN 'PENARIKAN' WHEN type = 'credit' THEN 'PEMASUKAN' ELSE tipe END WHERE tipe IS NULL",
    "UPDATE wallet_transactions SET keterangan = description WHERE keterangan IS NULL AND description IS NOT NULL",
    "ALTER TABLE withdrawals ADD COLUMN rekening VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE withdrawals ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "UPDATE withdrawals SET created_at = requested_at WHERE requested_at IS NOT NULL",
    "ALTER TABLE withdrawals MODIFY mitra_id BIGINT NOT NULL",
    "ALTER TABLE withdrawals MODIFY amount BIGINT NOT NULL",
  ];

  for (const migration of schemaMigrations) {
    try {
      await db.query(migration);
    } catch (error) {
      if (!/Duplicate column|Unknown column|Invalid use of NULL value/i.test(error.message || "")) {
        console.warn("Warning applying schema migration:", error.message);
      }
    }
  }

  console.log("Database schema initialized/verified");
};

const seedInitialAccounts = async () => {
  try {
    const [initialUsers] = await db.query("SELECT COUNT(*) AS count FROM users");
    const hadUsersBeforeAdminSeed = Number(initialUsers[0]?.count || 0) > 0;
    const defaultPassword = await bcrypt.hash("lintara123", 10);
    const [admins] = await db.query("SELECT id FROM users WHERE email = ?", ["admin@lintara.test"]);

    if (admins.length === 0) {
      await db.query(
        `INSERT INTO users (nama, email, no_hp, password, role, status, alamat)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "Admin Lintara",
          "admin@lintara.test",
          "080000000001",
          defaultPassword,
          "admin",
          "aktif",
          "Pekanbaru",
        ]
      );
      console.log("Seed akun admin berhasil: admin@lintara.test / lintara123");
    }

    if (hadUsersBeforeAdminSeed) {
      console.log("Users already exist, skipping seed");
      return;
    }

    // Insert user account
    const [userResult] = await db.query(
      `INSERT INTO users (nama, email, no_hp, password, role, status, alamat) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Pengguna Demo",
        "user@lintara.test",
        "081234567890",
        defaultPassword,
        "user",
        "aktif",
        "Pekanbaru"
      ]
    );

    // Insert mitra account
    const [mitraResult] = await db.query(
      `INSERT INTO users (nama, email, no_hp, password, role, status, alamat) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Mitra Demo",
        "mitra@lintara.test",
        "082345678901",
        defaultPassword,
        "mitra",
        "aktif",
        "Pekanbaru"
      ]
    );

    // Insert mitra profile
    await db.query(
      `INSERT INTO mitra_profiles (user_id, nama_perusahaan, alamat, status_verifikasi, saldo) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        mitraResult.insertId,
        "Lintara Mitra",
        "Pekanbaru",
        "verified",
        0
      ]
    );

    console.log("Seed akun demo berhasil:", {
      userId: userResult.insertId,
      mitraId: mitraResult.insertId,
    });
  } catch (error) {
    console.error("Seed akun awal gagal:", error.message || error);
  }
};

const initializeDatabase = async () => {
  await ensureSchema();
  await seedInitialAccounts();
};

module.exports = { ensureSchema, seedInitialAccounts, initializeDatabase };
