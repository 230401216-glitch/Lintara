# Panduan Lengkap: Setup Database & Backend + Testing End-to-End

## ✅ Errors Fixed (Semua Error Sudah Diperbaiki)

### Backend Fixes:
- ✅ crypto import: `require("crypto")` → `require("node:crypto")`
- ✅ substr deprecated: `.substr(2, 9)` → `.slice(2, 11)`

### Frontend Fixes:
- ✅ MitraDashboardData: Added missing `drivers` property
- ✅ SafeAreaView deprecated: Replaced with `View` + `useSafeAreaInsets()`
- ✅ Type assertion: Removed unnecessary `as never`
- ✅ Function nesting: Refactored to 4-level max
- ✅ Regex pattern: Updated to use `\D` instead of `[^0-9]`

**Status:** 🟢 All files compile without errors

---

## 🚀 Step 1: Setup MySQL Database

### Create Database
```bash
mysql -u root -p
mysql> CREATE DATABASE lintara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysql> USE lintara;
mysql> EXIT;
```

### Verify
```bash
mysql -u root lintara -e "SHOW TABLES;"
# Should be empty, backend will create schema on startup
```

---

## 🛠️ Step 2: Setup Backend Environment

### Create .env File
```bash
cd backend
cp .env.example .env
```

### Edit backend/.env
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lintara
JWT_SECRET=lintara_rahasia_2026_ubah_ini
```

**⚠️ Important:** Update `DB_PASSWORD` if your MySQL has password

### Install Dependencies
```bash
cd backend
npm install
```

---

## 🎯 Step 3: Start Backend Server

### Terminal 1 - Backend
```bash
cd backend
npm start
```

### Expected Output:
```
MySQL terhubung
Seed akun demo berhasil: { userId: 1, mitraId: 2 }
Server berjalan di port 5000
```

**✅ If you see this, backend is ready!**

---

## 📊 Step 4: Load Demo Travel Data

### Terminal 2 - Load Data (after backend running)
```bash
mysql lintara < backend/seed-demo-data.sql
```

### Verify Data Loaded
```bash
mysql lintara -e "SELECT COUNT(*) as travels FROM travels; SELECT COUNT(*) as routes FROM routes; SELECT COUNT(*) as schedules FROM schedules;"
```

**Expected Output:**
```
travels: 2
routes: 5
schedules: 8
```

---

## 🔌 Step 5: Update Frontend API URL

### Edit constants/api.ts
```typescript
// CHANGE THIS:
const API_BASE_URL = "http://192.168.1.64:5000";

// TO ONE OF THESE:
// For local machine:
const API_BASE_URL = "http://localhost:5000";

// For Android emulator:
const API_BASE_URL = "http://10.0.2.2:5000";

// For other devices on same network:
const API_BASE_URL = "http://<YOUR_MACHINE_IP>:5000";
```

**Find Your IP:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Look for IPv4 address like `192.168.x.x`

---

## 📱 Step 6: Start Frontend App

### Terminal 3 - Frontend
```bash
npm start
# or
expo start
```

---

## ✅ Step 7: Test Complete Booking Flow

### Test 1: Login & Browse Travel
```
1. Open app
2. Tap "Masuk" (Login)
3. Email: user@lintara.test
4. Password: lintara123
5. Verify: Home screen shows travel from database
```

### Test 2: Create Booking
```
1. Home screen → Select travel (e.g., "Lintara Express")
2. Tap travel → Go to detail
3. Tap "Pesan" (Book)
4. Fill form:
   - Nama: Pengguna Demo
   - HP: 081234567890
   - Email: user@lintara.test
   - Select seats: 1, 2, 3
   - Lokasi jemput: Pekanbaru
   - Metode bayar: QR Transfer (atau Cash)
5. Tap "Pesan"
6. Verify: Alert "Pemesanan Berhasil"
```

### Test 3: Verify Database Save
```bash
# Terminal 4 - Check booking saved
mysql lintara -e "
  SELECT b.id, b.kode_booking, b.nama_penumpang, b.total_harga, b.status_booking
  FROM bookings b
  ORDER BY b.created_at DESC LIMIT 1;
"
```

**Expected Output:**
```
id  | kode_booking           | nama_penumpang   | total_harga | status_booking
1   | BK1719574800000abc123  | Pengguna Demo    | 450000      | pending
```

### Test 4: Verify Booking Details
```bash
# Check booking seats
mysql lintara -e "
  SELECT booking_id, nomor_kursi FROM booking_seats 
  WHERE booking_id = 1
  ORDER BY nomor_kursi;
"
# Expected: 3 rows with kursi 1, 2, 3

# Check ticket
mysql lintara -e "SELECT * FROM tickets WHERE booking_id = 1;"
# Expected: 1 row with kode_tiket

# Check payment
mysql lintara -e "SELECT * FROM payments WHERE booking_id = 1;"
# Expected: 1 row dengan amount = 450000, status = pending
```

### Test 5: View Booking in Pesanan Tab
```
1. Still logged in as user
2. Tap "Pesanan" tab (or navigate to /pesanan)
3. Verify: Your booking appears in list
4. Tap booking to see details
5. Verify: All details correct (nama, kursi, harga, etc.)
```

### Test 6: Mitra Dashboard
```
1. Logout: Tap profile → Logout
2. Login as Mitra:
   - Email: mitra@lintara.test
   - Password: lintara123
3. Navigate to Mitra Dashboard (tab or menu)
4. Verify: Your booking appears in "Jadwal Hari Ini" section
5. Verify: Statistics show correct numbers
```

---

## 🧪 Advanced Testing: Multiple Bookings

### Create 2nd Booking
```
1. Logout mitra, login as user
2. Go home
3. Select DIFFERENT travel ("Lintara Comfort")
4. Book with different seats (5, 6, 7)
5. Check database: 2 bookings should exist
```

### Monitor Real-time
```bash
# Terminal 5 - Watch bookings in real-time
watch -n 1 "
  mysql lintara -e '
  SELECT 
    COUNT(*) as total_bookings,
    SUM(total_harga) as total_revenue,
    COUNT(DISTINCT user_id) as unique_users,
    NOW() as checked_at
  FROM bookings;
  '
"
```

---

## 🐛 Troubleshooting

### Error: "Cannot reach server"
```
1. Check backend running: curl http://localhost:5000/
2. Verify API_BASE_URL correct in constants/api.ts
3. Check firewall not blocking port 5000
4. Restart both backend and frontend
```

### Error: "Database gagal terhubung"
```
1. Check MySQL running: mysql -u root -p
2. Verify credentials in backend/.env
3. Check database exists: mysql -e "SHOW DATABASES;" | grep lintara
4. If not exist: mysql -e "CREATE DATABASE lintara;"
```

### Error: "Schedule tidak ditemukan"
```
1. Verify demo data loaded: 
   mysql lintara -e "SELECT COUNT(*) FROM schedules;"
2. If 0, load again: 
   mysql lintara < backend/seed-demo-data.sql
3. Check schedules are for today or future:
   mysql lintara -e "SELECT * FROM schedules WHERE tanggal >= CURDATE();"
```

### Error: "Booking tidak tersimpan"
```
1. Check transaction log:
   tail -f backend/server.js (if logging enabled)
2. Verify user is logged in (check token)
3. Check schedule_id exists:
   mysql lintara -e "SELECT COUNT(*) FROM schedules;"
4. Try creating booking again with detailed logging
```

### Error: "Mitra tidak melihat booking"
```
1. Check mitra role:
   mysql lintara -e "SELECT id, email, role FROM users WHERE email='mitra@lintara.test';"
2. Verify mitra token valid:
   - Re-login sebagai mitra
   - Copy token dari response
3. Test API manually:
   curl http://localhost:5000/api/bookings/all \
     -H "Authorization: Bearer <token>"
```

---

## 📊 Database Verification Checklist

Run this to verify complete setup:

```bash
#!/bin/bash
echo "=== Database Status ==="
mysql lintara -e "SHOW TABLES;" | wc -l
echo "Tables count should be 10"

echo "\n=== Demo Accounts ==="
mysql lintara -e "SELECT email, role FROM users LIMIT 2;"

echo "\n=== Travel Data ==="
mysql lintara -e "SELECT COUNT(*) as travels FROM travels; SELECT COUNT(*) as routes FROM routes;"

echo "\n=== Schedules Today ==="
mysql lintara -e "SELECT COUNT(*) FROM schedules WHERE tanggal = CURDATE();"

echo "\n=== Test Connection ==="
curl -s http://localhost:5000/ | grep -q "Backend Lintara Aktif" && echo "✅ Backend OK" || echo "❌ Backend FAILED"
```

---

## 🎯 Complete Testing Checklist

- [ ] Backend server running (port 5000)
- [ ] MySQL database created and schema auto-initialized
- [ ] Demo accounts created (user & mitra)
- [ ] Demo travel data loaded
- [ ] Frontend API_BASE_URL updated
- [ ] Frontend app starts without errors
- [ ] User can login with demo credentials
- [ ] Home screen shows travel list from database
- [ ] User can create booking
- [ ] Booking saved to 4 tables (bookings, booking_seats, tickets, payments)
- [ ] User can view booking in Pesanan tab
- [ ] Mitra can login and see booking in dashboard
- [ ] Multiple bookings work correctly
- [ ] Booking details completely accurate

---

## 🚀 What Happens Behind the Scenes

```
BOOKING CREATION FLOW:
1. User fills form → POST /api/bookings
   ├─ Frontend sends: schedule_id, seats, nama, hp, lokasi_jemput, metode
   
2. Backend processes:
   ├─ Validate input ✓
   ├─ Find schedule from DB ✓
   ├─ Check seat availability ✓
   ├─ START TRANSACTION
   │  ├─ INSERT bookings table
   │  ├─ INSERT booking_seats for each kursi
   │  ├─ INSERT tickets dengan kode unik
   │  ├─ INSERT payments dengan amount & metode
   │  └─ COMMIT TRANSACTION
   ├─ Return booking_id & kode_booking
   
3. Frontend receives:
   ├─ Save to AsyncStorage
   ├─ Show success alert
   ├─ Allow navigate to payment/pesanan
   
4. Booking now visible:
   ├─ User: Pesanan tab → My bookings
   ├─ Mitra: Dashboard → Jadwal Hari Ini
   ├─ Database: All 4 tables updated
```

---

## 📞 Getting Help

If something doesn't work:

1. **Check logs:**
   - Backend logs: Look at terminal where `npm start` running
   - MySQL logs: `mysql -u root -p -e "SHOW ERRORS;"`

2. **Test API directly:**
   ```bash
   curl -X GET http://localhost:5000/api/travels
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@lintara.test","password":"lintara123"}'
   ```

3. **Reset database if needed:**
   ```bash
   mysql -u root lintara -e "DROP TABLE IF EXISTS bookings, booking_seats, tickets, payments, schedules, routes, travels, drivers, mitra_profiles, users;"
   # Then restart backend - schema will recreate
   ```

---

## 🎉 Success!

If all tests pass, your app is:
- ✅ Connected to database
- ✅ Persisting booking data
- ✅ Displaying data correctly
- ✅ Mitra can see user bookings
- ✅ Ready for additional features

**Next steps:** Implement booking confirmation by mitra, payment gateway, notifications

---

**Last Updated:** 2026-06-28
**Status:** Ready for Testing
