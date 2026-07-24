# BOOKING FLOW VERIFICATION

## 📋 Complete End-to-End Booking Flow

```
FRONTEND (Expo App)
├─ Login: user@lintara.test / lintara123
│  └─ Get JWT token
│
├─ Home Screen: Lihat travel catalog
│  └─ Pilih travel dari demo data
│
├─ Booking Form (pesan.tsx)
│  ├─ Isi form: nama, HP, email, kursi, lokasi jemput, metode bayar
│  └─ Klik "Pesan"
│
└─ Create Booking Request
   │
   BACKEND PROCESSING
   ├─ [1] Find Schedule
   │    GET /api/travels/schedules?routeId=X&date=YYYY-MM-DD
   │    └─ Cari schedule_id dari database
   │
   ├─ [2] Validate & Save Booking
   │    POST /api/bookings
   │    │
   │    ├─ Start Transaction
   │    ├─ INSERT INTO bookings (kode_booking, user_id, schedule_id, ...)
   │    │    └─ Save: id, user_id, schedule_id, jumlah_tiket, total_harga, status
   │    │
   │    ├─ INSERT INTO booking_seats (booking_id, nomor_kursi)
   │    │    └─ Save: kursi yang dipilih user
   │    │
   │    ├─ INSERT INTO tickets (booking_id, kode_tiket, status)
   │    │    └─ Generate: kode tiket unik
   │    │
   │    ├─ INSERT INTO payments (booking_id, amount, payment_method, status)
   │    │    └─ Save: amount, metode pembayaran, status pending
   │    │
   │    └─ Commit Transaction
   │
   └─ Response: { booking_id, kode_booking, total_harga }
      │
      FRONTEND
      └─ Alert: "Pemesanan Berhasil"
         ├─ Save booking ke AsyncStorage
         └─ Navigate to Payment/View Order
```

---

## 🔍 Verification Checklist

### Phase 1: Backend Initialization ✅
```bash
# 1. Backend running
$ cd backend && node server.js
Expected: "Server berjalan di port 5000"

# 2. Database schema created
$ mysql lintara -e "SHOW TABLES;" | grep -E 'bookings|booking_seats|tickets|payments'
Expected: Semua tabel ada

# 3. Demo accounts seeded
$ mysql lintara -e "SELECT email, role FROM users;"
Expected:
   user@lintara.test      | user
   mitra@lintara.test     | mitra
```

### Phase 2: Travel Data Setup ⚠️ PENTING
```bash
# 1. Load demo travel data
$ mysql lintara < backend/seed-demo-data.sql

# 2. Verify travel data
$ mysql lintara -e "
  SELECT 
    t.id as travel_id,
    t.nama_travel,
    r.id as route_id,
    r.asal,
    r.tujuan,
    r.harga,
    COUNT(s.id) as schedule_count
  FROM travels t
  LEFT JOIN routes r ON t.id = r.travel_id
  LEFT JOIN schedules s ON r.id = s.route_id
  GROUP BY t.id, r.id;
"

Expected: Travel dengan routes dan schedules tersedia
```

### Phase 3: Frontend Auth Testing ✅
```bash
# 1. Login API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@lintara.test",
    "password": "lintara123"
  }'

Expected Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nama": "Pengguna Demo",
    "email": "user@lintara.test",
    "role": "user"
  }
}

# 2. Copy token value untuk step berikutnya
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Phase 4: Schedule Discovery ✅
```bash
# 1. Get available schedules
ROUTE_ID=1
DATE=YYYY-MM-DD  # Ganti dengan hari ini atau besok

curl -X GET "http://localhost:5000/api/travels/schedules?routeId=$ROUTE_ID&date=$DATE" \
  -H "Authorization: Bearer $TOKEN"

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "route_id": 1,
      "tanggal": "2026-06-28",
      "jam_berangkat": "08:00",
      "total_kursi": 20,
      "status": "aktif"
    }
  ]
}

# 3. Copy schedule_id untuk booking creation
SCHEDULE_ID="1"
```

### Phase 5: Booking Creation 🎯 MAIN TEST
```bash
# 1. Prepare booking request
BOOKING_PAYLOAD='{
  "schedule_id": 1,
  "seats": [1, 2, 3],
  "nama_penumpang": "Pengguna Demo",
  "no_hp_penumpang": "081234567890",
  "lokasi_jemput": "Pekanbaru",
  "metode_pembayaran": "qris",
  "tipe_bus": "AC"
}'

# 2. Create booking via API
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BOOKING_PAYLOAD"

Expected Response:
{
  "success": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "booking_id": 1,
    "kode_booking": "BK1719574800000abc123",
    "total_harga": 450000,
    "metode_pembayaran": "qris"
  }
}

# 3. Copy booking_id untuk verification
BOOKING_ID="1"
```

### Phase 6: Database Verification 🔐
```bash
# 1. Check booking record
$ mysql lintara -e "
  SELECT id, kode_booking, nama_penumpang, total_harga, status_booking, status_pembayaran
  FROM bookings
  WHERE id = $BOOKING_ID;
"

Expected:
   id | kode_booking              | nama_penumpang    | total_harga | status_booking | status_pembayaran
   1  | BK1719574800000abc123     | Pengguna Demo      | 450000      | pending        | pending

# 2. Check booking seats
$ mysql lintara -e "
  SELECT booking_id, nomor_kursi
  FROM booking_seats
  WHERE booking_id = $BOOKING_ID
  ORDER BY nomor_kursi;
"

Expected:
   booking_id | nomor_kursi
   1          | 1
   1          | 2
   1          | 3

# 3. Check ticket
$ mysql lintara -e "
  SELECT id, booking_id, kode_tiket, status
  FROM tickets
  WHERE booking_id = $BOOKING_ID;
"

Expected: 1 record dengan kode tiket unik

# 4. Check payment
$ mysql lintara -e "
  SELECT id, booking_id, amount, payment_method, status
  FROM payments
  WHERE booking_id = $BOOKING_ID;
"

Expected: 1 record dengan amount = 450000, status = pending
```

### Phase 7: Frontend Booking Retrieval ✅
```bash
# Get user's bookings
curl -X GET http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN"

Expected Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode_booking": "BK1719574800000abc123",
      "nama_penumpang": "Pengguna Demo",
      "total_harga": 450000,
      "status_booking": "pending",
      "status_pembayaran": "pending"
    }
  ]
}

# Verifikasi booking muncul di app pesanan/(tabs)/pesanan.tsx
```

### Phase 8: Mitra Dashboard Display ✅
```bash
# 1. Login sebagai mitra
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mitra@lintara.test",
    "password": "lintara123"
  }'

# 2. Get all bookings (mitra)
MITRA_TOKEN="<token_dari_mitra_login>"

curl -X GET http://localhost:5000/api/bookings/all \
  -H "Authorization: Bearer $MITRA_TOKEN"

Expected Response: Array dengan booking yang dibuat user

# 3. Verifikasi booking muncul di Mitra Dashboard
# Navigate: (mitra)/dashboard
# Lihat section "Jadwal Hari Ini" menampilkan booking user
```

---

## ❌ Troubleshooting Guide

### Error: "Schedule tidak ditemukan"
```
Causes:
- Route tidak ada di database
- Tidak ada schedule untuk tanggal yang dipilih
- Schedule sudah expired atau status != 'aktif'

Fix:
1. Jalankan: mysql lintara < backend/seed-demo-data.sql
2. Verifikasi: SELECT * FROM schedules WHERE tanggal = CURDATE();
3. Pastikan tanggal di schedule >= hari ini
```

### Error: "Beberapa kursi sudah dipesan"
```
Causes:
- Kursi yang dipilih sudah dipesan orang lain
- Data booking_seats belum clean

Fix:
1. Pilih kursi yang berbeda
2. Check: SELECT nomor_kursi FROM booking_seats 
          WHERE booking_id IN 
          (SELECT id FROM bookings WHERE schedule_id = 1);
3. Jika perlu reset: DELETE FROM booking_seats; DELETE FROM bookings;
```

### Error: "Token tidak valid"
```
Causes:
- JWT_SECRET tidak konsisten antara backend dan frontend
- Token sudah expired
- Authorization header format salah

Fix:
1. Verifikasi JWT_SECRET di backend/.env
2. Re-login untuk mendapat token baru
3. Format header: Authorization: Bearer <token>
```

### Error: "Cannot reach server"
```
Causes:
- API_BASE_URL di constants/api.ts salah
- Backend tidak running
- Firewall blocking koneksi

Fix:
1. Cek: curl http://localhost:5000/
2. Update API_BASE_URL jika perlu
3. Restart backend & frontend
```

---

## 📊 Performance Monitoring

### Real-time Booking Monitor:
```bash
# Terminal: Refresh setiap 2 detik
watch -n 2 "
  mysql lintara -e '
  SELECT COUNT(*) as total_bookings, 
         SUM(total_harga) as total_revenue,
         COUNT(DISTINCT user_id) as unique_users
  FROM bookings
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY);
  '
"
```

### Database Slow Query Log:
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Check logs
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

---

## ✅ Success Indicators

Jika semua fase di atas berhasil tanpa error, maka:
- ✅ Database connection working
- ✅ Travel catalog available
- ✅ User dapat membuat booking
- ✅ Booking tersimpan complete di 4 tabel (bookings, booking_seats, tickets, payments)
- ✅ Mitra dapat melihat semua bookings
- ✅ App siap untuk production atau fitur lanjutan

---

## 🎯 Next Steps

1. **Payment Gateway Integration** - Integrasikan dengan metode pembayaran (QRIS, Bank Transfer)
2. **Booking Confirmation** - Mitra dapat confirm/reject booking
3. **Real-time Notification** - Notifikasi ketika booking baru masuk
4. **Seat Availability API** - Show available seats real-time
5. **Booking History & Analytics** - Dashboard analytics untuk mitra dan admin

---

**Last Updated:** 2026-06-28
**Status:** Complete Testing Guide Ready
