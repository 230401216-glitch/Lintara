const db = require("../config/db");

const isMitraOrAdmin = (role) => ["mitra", "admin"].includes(String(role || "").trim().toLowerCase());

const ensureDriversTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mitra_id INT NOT NULL,
      nama_supir VARCHAR(100) NOT NULL,
      nomor_hp VARCHAR(30) DEFAULT '',
      plat_kendaraan VARCHAR(30) DEFAULT '',
      status VARCHAR(20) DEFAULT 'aktif',
      catatan TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const resolveMitraProfileIdFromValue = async (value) => {
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

const resolveMitraProfileId = async (req) => {
  const role = String(req.user?.role || "").trim().toLowerCase();

  if (role === "admin") {
    const explicitValue = req.body?.pt_id ?? req.body?.mitra_id;
    if (explicitValue) {
      return resolveMitraProfileIdFromValue(explicitValue);
    }
  }

  return resolveMitraProfileIdFromValue(req.user?.id);
};

const getDriverOwnership = async (req, driverId) => {
  if (String(req.user?.role || "").trim().toLowerCase() === "admin") {
    return true;
  }

  const mitraProfileId = await resolveMitraProfileId(req);
  if (!mitraProfileId) {
    return false;
  }

  const [rows] = await db.query("SELECT id FROM drivers WHERE id = ? AND mitra_id = ?", [driverId, mitraProfileId]);
  return rows.length > 0;
};

exports.getDrivers = async (req, res) => {
  try {
    await ensureDriversTable();
    const { mitraId, ptId } = req.query;
    const params = [];

    let query = "SELECT * FROM drivers WHERE 1=1";

    const filterValue = ptId ?? mitraId;
    if (filterValue) {
      const resolvedMitraId = await resolveMitraProfileIdFromValue(filterValue);
      if (!resolvedMitraId) {
        return res.json({ success: true, data: [] });
      }

      query += " AND mitra_id = ?";
      params.push(resolvedMitraId);
    }

    query += " ORDER BY id DESC";

    const [drivers] = await db.query(query, params);

    res.json({ success: true, data: drivers });
  } catch (error) {
    console.error("Get drivers error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createDriver = async (req, res) => {
  try {
    await ensureDriversTable();

    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki akses menambah supir" });
    }

    const { nama_supir, nomor_hp, plat_kendaraan, status, catatan } = req.body;

    if (!nama_supir || !String(nama_supir).trim()) {
      return res.status(400).json({ success: false, message: "Nama supir harus diisi" });
    }

    const mitraProfileId = await resolveMitraProfileId(req);
    if (!mitraProfileId) {
      return res.status(400).json({ success: false, message: "Profil mitra tidak ditemukan" });
    }

    const [result] = await db.query(
      "INSERT INTO drivers (mitra_id, nama_supir, nomor_hp, plat_kendaraan, status, catatan) VALUES (?, ?, ?, ?, ?, ?)",
      [mitraProfileId, String(nama_supir).trim(), String(nomor_hp || ""), String(plat_kendaraan || ""), status || "aktif", catatan || ""]
    );

    res.status(201).json({ success: true, message: "Supir berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    console.error("Create driver error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    await ensureDriversTable();

    if (!isMitraOrAdmin(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Anda tidak memiliki akses mengubah supir" });
    }

    const { id } = req.params;
    const isOwned = await getDriverOwnership(req, id);
    if (!isOwned) {
      return res.status(403).json({ success: false, message: "Supir tidak sesuai dengan akun mitra" });
    }

    const fields = [];
    const values = [];
    const { nama_supir, nomor_hp, plat_kendaraan, status, catatan } = req.body;

    if (nama_supir !== undefined) {
      fields.push("nama_supir = ?");
      values.push(String(nama_supir).trim());
    }
    if (nomor_hp !== undefined) {
      fields.push("nomor_hp = ?");
      values.push(String(nomor_hp || ""));
    }
    if (plat_kendaraan !== undefined) {
      fields.push("plat_kendaraan = ?");
      values.push(String(plat_kendaraan || ""));
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(String(status));
    }
    if (catatan !== undefined) {
      fields.push("catatan = ?");
      values.push(String(catatan || ""));
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada data yang diubah" });
    }

    values.push(id);
    await db.query(`UPDATE drivers SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updatedRows] = await db.query("SELECT * FROM drivers WHERE id = ?", [id]);

    res.json({ success: true, message: "Supir berhasil diperbarui", data: updatedRows[0] });
  } catch (error) {
    console.error("Update driver error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
