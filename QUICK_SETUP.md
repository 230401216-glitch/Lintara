# SETUP CEPAT - Database Connection

## 🚀 Quick Setup (5 Langkah)

### Langkah 1: Setup Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` dan pastikan konfigurasi sesuai dengan MySQL Anda:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lintara
JWT_SECRET=lintara_rahasia_2026_ubah_ini
```

### Langkah 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Langkah 3: Update Frontend API URL
Edit `constants/api.ts` dan sesuaikan `API_BASE_URL`:

**Jika development di localhost:**
```typescript
const API_BASE_URL = "http://localhost:5000";
```

**Jika testing di Android Emulator:**
```typescript
const API_BASE_URL = "http://10.0.2.2:5000";
```

**Jika testing di device lain:**
```typescript
const API_BASE_URL = "http://<YOUR_MACHINE_IP>:5000";
```

Cek IP machine Anda dengan: `ipconfig` (Windows) atau `ifconfig` (Mac/Linux)

### Langkah 4: Start Backend Server
```bash
cd backend
npm start
# atau
node server.js
```

Expected output:
```
MySQL terhubung
Seed akun demo berhasil: { userId: 1, mitraId: 2 }
Server berjalan di port 5000
```

### Langkah 5: Start Frontend (New Terminal)
```bash
npm start
# atau
expo start
```

---

## ✅ Verifikasi Setup Berhasil

### Check 1: Backend Response
```bash
curl http://localhost:5000/
```
Harus return: `{ "success": true, "message": "Backend Lintara Aktif" }`

### Check 2: Login & Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@lintara.test","password":"lintara123"}'
```

Harus return token:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "nama": "Pengguna Demo", "role": "user" }
}
```

### Check 3: Database Tables
```bash
mysql -u root lintara -e "SHOW TABLES;"
```

Harus ada 10 tabel:
- bookings ✅
- booking_seats ✅
- tickets ✅
- payments ✅
- schedules ✅
- routes ✅
- travels ✅
- users ✅
- drivers ✅
- mitra_profiles ✅

---

## 🎯 Test Booking Flow (Manual)

### Scenario: User membuat booking dan Mitra melihatnya

**Step 1: User Login**
1. Buka app Lintara
2. Klik "Masuk"
3. Email: `user@lintara.test`
4. Password: `lintara123`
5. Verifikasi berhasil login

**Step 2: User Buat Booking**
1. Home screen → Lihat Travel yang tersedia
2. Pilih travel
3. Isi form:
   - Nama: Pengguna Demo
   - HP: 081234567890
   - Email: user@lintara.test
   - Pilih kursi (mis: 1, 2, 3)
   - Lokasi jemput: Pekanbaru
   - Metode: Cash atau QR Transfer
4. Klik "Pesan"
5. Verifikasi: Alert "Pemesanan Berhasil"

**Step 3: Verifikasi Database**
```bash
mysql> USE lintara;
mysql> SELECT id, kode_booking, nama_penumpang, total_harga FROM bookings ORDER BY created_at DESC LIMIT 1;
```

Harus ada record booking terbaru dengan nama "Pengguna Demo"

**Step 4: Check Booking Details**
```bash
# Ganti <booking_id> dengan ID dari query di atas
mysql> SELECT * FROM booking_seats WHERE booking_id = 1;
mysql> SELECT * FROM tickets WHERE booking_id = 1;
mysql> SELECT * FROM payments WHERE booking_id = 1;
```

**Step 5: Mitra Lihat Booking**
1. Logout dari akun user
2. Klik "Masuk" lagi
3. Email: `mitra@lintara.test`
4. Password: `lintara123`
5. Navigate ke: Dashboard Mitra (atau tab mitra)
6. Verifikasi: Lihat booking user di section "Jadwal Hari Ini"

---

## 🔧 Konfigurasi Lanjutan

### Database Connection Pool Tuning
Edit `backend/config/db.js`:
```javascript
const db = mysql.createPool({
  // ... existing config
  connectionLimit: 10,      // Jumlah koneksi maksimal
  queueLimit: 0,           // Unlimited queue
  connectTimeout: 10000,   // 10 detik timeout
  enableKeepAlive: true,   // Keep connection alive
});
```

### Seed Travel Data (Optional)
Jika ingin menambah travel test, insert ke database:
```sql
INSERT INTO travels (mitra_id, nama_travel, status) 
VALUES (2, 'Lintara Express', 'aktif');

INSERT INTO routes (travel_id, asal, tujuan, harga, status) 
VALUES (1, 'Pekanbaru', 'Medan', 150000, 'aktif');

INSERT INTO schedules (route_id, tanggal, jam_berangkat, total_kursi, status)
VALUES (1, CURDATE(), '08:00', 20, 'aktif');
```

---

## 🐛 Common Issues & Solutions

| Error | Solusi |
|-------|--------|
| `Cannot reach server` | Verifikasi IP di `constants/api.ts`, pastikan backend running |
| `MySQL terhubung gagal` | Cek credentials di `.env`, pastikan MySQL running |
| `Token tidak valid` | Re-login atau check `JWT_SECRET` konsistensi |
| `Schedule tidak ditemukan` | Pastikan ada travel/route/schedule di database |
| `Booking tidak muncul di dashboard mitra` | Check role mitra = "mitra", verify token valid |

---

## 📊 Monitoring Real-Time

### Terminal 3 - Watch Database:
```bash
watch -n 2 "mysql -u root lintara -e 'SELECT COUNT(*) as total_bookings FROM bookings; SELECT COUNT(*) as total_users FROM users;'"
```

### Terminal 4 - Backend Logs (jika perlu):
```bash
# Jika sudah running, lihat logs dengan:
tail -f backend/server.js
```

---

## 📝 Testing Checklist

- [ ] Backend server running tanpa error
- [ ] Database connection test berhasil
- [ ] Login API menghasilkan token valid
- [ ] User dapat membuat booking
- [ ] Booking tersimpan di database dengan complete data
- [ ] Mitra dapat melihat booking di dashboard
- [ ] Booking detail (seats, tickets, payments) semua tersimpan
- [ ] Konfirmasi booking oleh mitra berfungsi (jika sudah implemented)

---

**Dokumentasi Lengkap:** Baca `DATABASE_CONNECTION_GUIDE.md`
