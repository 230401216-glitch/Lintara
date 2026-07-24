# Database Connection Guide - Lintara

## Status: ✅ Backend & Schema Siap

Database connection framework sudah lengkap dan siap digunakan. Berikut adalah panduan verifikasi dan setup lengkap.

---

## 1. VERIFIKASI ENVIRONMENT SETUP

### Backend Environment File
Pastikan file `.env` di folder `backend/` sudah dibuat dengan konfigurasi benar:

```bash
# backend/.env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lintara
JWT_SECRET=lintara_rahasia_2026_ubah_ini
```

**Catatan:** Sesuaikan `DB_HOST`, `DB_USER`, `DB_PASSWORD` dengan konfigurasi MySQL lokal Anda.

### Frontend API Configuration
File `constants/api.ts` sudah menggunakan URL server:
```
http://192.168.1.64:5000
```

**⚠️ PENTING:** Ubah IP address sesuai dengan mesin development Anda:
- Local machine: `http://localhost:5000`
- Android emulator: `http://10.0.2.2:5000`
- Device lain: `http://<YOUR_IP>:5000`

---

## 2. DATABASE SCHEMA VERIFICATION

### Tabel yang Sudah Dibuat Otomatis:
Ketika backend dijalankan, skema berikut akan dibuat otomatis di MySQL:

✅ **users** - User registration & authentication
- Kolom: id, nama, email, no_hp, password, role, status, foto, created_at

✅ **mitra_profiles** - Data profil mitra/operator
- Kolom: id, user_id, nama_perusahaan, alamat, no_hp, status, created_at

✅ **travels** - Data kendaraan travel
- Kolom: id, mitra_id, nama_travel, deskripsi, ac, seat_layout, foto, status, etc.

✅ **routes** - Rute perjalanan
- Kolom: id, travel_id, asal, tujuan, harga, durasi, status, created_at

✅ **schedules** - Jadwal perjalanan
- Kolom: id, route_id, tanggal, jam_berangkat, total_kursi, status, created_at

✅ **bookings** - Data pemesanan tiket ⭐ UTAMA
- Kolom: id, user_id, schedule_id, travel_id, route_id, nama_penumpang, no_hp_penumpang, lokasi_jemput, metode_pembayaran, tipe_bus, total_harga, status_booking, status_pembayaran, kode_booking, jumlah_tiket, created_at

✅ **booking_seats** - Nomor kursi yang dipesan
- Kolom: id, booking_id, nomor_kursi, created_at

✅ **tickets** - Tiket/karcis
- Kolom: id, booking_id, kode_tiket, status, created_at

✅ **payments** - Transaksi pembayaran
- Kolom: id, booking_id, payment_method, status, amount, paid_at, created_at

✅ **drivers** - Data supir/pengemudi
- Kolom: id, mitra_id, nama_supir, nomor_hp, plat_kendaraan, status, catatan, created_at

---

## 3. DEMO DATA SEEDING

Ketika backend dijalankan pertama kali, akun demo otomatis dibuat:

```
👤 Akun Pengguna (User):
   Email: user@lintara.test
   Password: lintara123
   Role: user

👥 Akun Mitra:
   Email: mitra@lintara.test
   Password: lintara123
   Role: mitra
```

Gunakan akun ini untuk testing.

---

## 4. API ENDPOINT VERIFICATION

### Authentication Flow:
```
POST /api/auth/login
├─ Request: { email, password }
├─ Response: { success, token, user: { id, nama, email, role } }
└─ Menyimpan token untuk Authorization header di request berikutnya
```

### Booking Creation Flow:
```
1. GET /api/travels/schedules?routeId=X&date=YYYY-MM-DD
   └─ Ambil schedule_id yang tersedia

2. POST /api/bookings
   ├─ Headers: Authorization: Bearer <token>
   ├─ Body: {
   │    schedule_id,
   │    seats: [1, 2, 3],
   │    nama_penumpang,
   │    no_hp_penumpang,
   │    lokasi_jemput,
   │    metode_pembayaran: "cash" | "qris",
   │    tipe_bus
   │  }
   └─ Response: { success, data: { booking_id, kode_booking, total_harga } }

3. GET /api/bookings
   ├─ Headers: Authorization: Bearer <token>
   └─ Ambil booking user dari database

4. GET /api/bookings/all (mitra only)
   ├─ Headers: Authorization: Bearer <token>
   └─ Ambil semua booking untuk mitra
```

---

## 5. IMPLEMENTATION CHECKLIST

### ✅ Backend Setup
- [x] Database schema di `backend/initDatabase.js` - lengkap dengan 10 tabel
- [x] Database connection pool di `backend/config/db.js` - siap
- [x] Booking controller di `backend/controllers/bookingController.js` - dengan transaction support
- [x] Authentication middleware di `backend/middleware/auth.js` - validasi JWT
- [x] Booking routes di `backend/routes/bookingRoutes.js` - POST, GET, DELETE endpoints

### ✅ Frontend Setup
- [x] API endpoints di `constants/api.ts` - semua defined
- [x] Booking service di `lib/services/bookingStore.ts` - dengan server sync
- [x] Auth context di `lib/context/AuthContext.tsx` - token management
- [x] Booking page di `app/pesan.tsx` - form dengan `createBookingOnServer()`
- [x] Mitra dashboard di `app/(mitra)/dashboard.tsx` - display bookings

### ⚠️ Testing Required
- [ ] Backend server running pada port 5000
- [ ] MySQL database online dengan schema initialized
- [ ] Login flow menghasilkan valid JWT token
- [ ] Booking creation post ke `/api/bookings` dan tersimpan di database
- [ ] Mitra dashboard menampilkan bookings dari database dengan benar
- [ ] Konfirmasi booking oleh mitra

---

## 6. QUICK START COMMAND

### Terminal 1 - Backend:
```bash
cd backend
npm install
node server.js
```

Expected output:
```
MySQL terhubung
Seed akun demo berhasil: { userId: 1, mitraId: 2 }
Server berjalan di port 5000
```

### Terminal 2 - Frontend:
```bash
npm start
# atau
expo start
```

---

## 7. TESTING FLOW (Manual)

### Step 1: Login sebagai User
```
1. Buka app, ke halaman login
2. Email: user@lintara.test
3. Password: lintara123
4. Verifikasi token disimpan di AuthContext
```

### Step 2: Buat Booking
```
1. Pilih travel dari home screen
2. Isi form pemesanan (nama, HP, lokasi jemput)
3. Pilih kursi dan metode pembayaran
4. Klik "Pesan"
5. Verifikasi alert berhasil + booking tersimpan di database
```

### Step 3: Verifikasi Database
```bash
mysql> USE lintara;
mysql> SELECT * FROM bookings;
mysql> SELECT * FROM booking_seats WHERE booking_id = <booking_id>;
mysql> SELECT * FROM tickets WHERE booking_id = <booking_id>;
mysql> SELECT * FROM payments WHERE booking_id = <booking_id>;
```

### Step 4: Login sebagai Mitra & Lihat Bookings
```
1. Logout dari akun user
2. Login dengan mitra@lintara.test
3. Akses dashboard mitra: (mitra)/dashboard
4. Verifikasi booking yang baru dibuat muncul di "Jadwal Hari Ini"
5. Klik booking untuk konfirmasi
```

---

## 8. TROUBLESHOOTING

### ❌ "Cannot reach server"
**Solusi:**
- Verifikasi IP address di `constants/api.ts`
- Pastikan backend running: `node backend/server.js`
- Check firewall settings
- Gunakan `http://localhost:5000` jika di emulator

### ❌ "Database gagal terhubung"
**Solusi:**
- Pastikan MySQL running: `mysql -u root -p`
- Verifikasi credentials di `backend/.env`
- Buat database jika belum: `CREATE DATABASE lintara;`

### ❌ "Token tidak valid"
**Solusi:**
- Pastikan JWT_SECRET sama di backend dan frontend
- Re-login untuk mendapatkan token baru
- Check Authorization header format: `Bearer <token>`

### ❌ "Schedule tidak ditemukan"
**Solusi:**
- Pastikan admin sudah membuat travel/route/schedule di database
- Query: `SELECT * FROM schedules;`
- Atau seed data travel dari admin dashboard

---

## 9. MONITORING COMMANDS

### Check Backend Health:
```bash
curl http://localhost:5000/
# Expected: { "success": true, "message": "Backend Lintara Aktif" }
```

### Check Database Connection:
```bash
curl -X GET http://localhost:5000/api/travels \
  -H "Authorization: Bearer <token>"
```

### Monitor Bookings (Real-time):
```bash
# Terminal 3
watch -n 1 "mysql -u root lintara -e 'SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;'"
```

---

## 10. NEXT STEPS

1. **Setup MySQL & run backend** - Pastikan connection test berhasil
2. **Test login flow** - Verifikasi token diterima
3. **Create test booking** - Booking disimpan ke database
4. **Mitra confirmation** - Implementasi endpoint untuk mitra approve booking
5. **Payment gateway** - Integrasi metode pembayaran
6. **Real travel data** - Seed data travel dari database admin

---

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `backend/initDatabase.js` | Schema creation & seeding | ✅ Ready |
| `backend/config/db.js` | Database connection pool | ✅ Ready |
| `backend/controllers/bookingController.js` | Booking CRUD logic | ✅ Ready |
| `backend/routes/bookingRoutes.js` | API endpoints | ✅ Ready |
| `lib/services/bookingStore.ts` | Frontend booking service | ✅ Ready |
| `constants/api.ts` | API configuration | ⚠️ IP needed |
| `app/pesan.tsx` | Booking form | ✅ Ready |
| `app/(mitra)/dashboard.tsx` | Mitra view | ✅ Ready |

---

**Last Updated:** 2026-06-28  
**Status:** Ready for Testing
