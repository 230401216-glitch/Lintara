# 🔴 Server Tidak Terhubung - Fix Guide

## Problem: "Tidak dapat terhubung ke server" saat Register/Login

---

## ✅ Step 1: Pastikan Backend Running

### Terminal 1 - Jalankan Backend:
```bash
cd backend
npm run dev
```

**Expected output:**
```
MySQL terhubung
Server berjalan di port 5000
```

❌ **Jika ada error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
→ MySQL tidak running (lihat Step 3)

---

## ✅ Step 2: Verifikasi API URL di Frontend

### Cek `constants/api.ts`:

**Untuk testing di Web Browser:**
```typescript
const API_BASE_URL = "http://localhost:5000";
```

**Untuk Android Emulator:**
```typescript
const API_BASE_URL = "http://10.0.2.2:5000";  // ⚠️ Jangan gunakan localhost!
```

**Untuk iOS Simulator:**
```typescript
const API_BASE_URL = "http://localhost:5000";
```

**Untuk Real Device (ubah XXX.XXX):**
```bash
# Buka CMD di Windows, cari IPv4:
ipconfig

# Misal IPv4 Address: 192.168.1.100
# Maka di constants/api.ts:
const API_BASE_URL = "http://192.168.1.100:5000";
```

---

## ✅ Step 3: Pastikan MySQL Running

### Windows:
```bash
# Buka Services (Win+R ketik: services.msc)
# Cari: MySQL80 atau MariaDB
# Klik kanan → Start (jika belum running)
```

### macOS:
```bash
brew services start mysql
```

### Linux:
```bash
sudo systemctl start mysql
```

### Test MySQL connection:
```bash
mysql -u root -p
# Tekan Enter jika tidak ada password
```

Jika berhasil login ke MySQL, ketik:
```sql
SHOW DATABASES;
USE lintara;
SHOW TABLES;
```

Harus ada banyak tabel. Jika tidak, import SQL:
```bash
mysql -u root -p lintara < "lintara (2).sql"
```

---

## ✅ Step 4: Verifikasi .env Backend

### Check file: `backend/.env`

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        # Kosong atau sesuai password MySQL Anda
DB_NAME=lintara
JWT_SECRET=lintara_rahasia_2026
```

⚠️ **Common Issues:**
- `DB_PASSWORD` salah → ganti dengan password MySQL Anda
- `DB_HOST` bukan localhost → ubah ke localhost
- `DB_NAME` bukan lintara → ubah ke lintara atau import SQL

---

## ✅ Step 5: Test Backend Langsung

### Terminal baru (jangan close backend terminal):

```bash
# Test 1: Cek server running
curl http://localhost:5000/

# Expected response:
# {"success":true,"message":"Backend Lintara Aktif"}

# Test 2: Coba register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama":"Test",
    "email":"test@test.com",
    "no_hp":"081234567890",
    "password":"password123"
  }'

# Expected response:
# {"success":true,"message":"Register berhasil","user_id":1}
```

Jika berhasil, berarti backend OK ✅

---

## ✅ Step 6: Frontend - Lihat Console Logs

### Android Emulator:
1. Buka Android Studio
2. Buka Logcat tab
3. Filter: "📤" atau "❌"
4. Coba register di app
5. Lihat error message di console

### iOS Simulator:
1. Buka Xcode Console
2. Coba register
3. Lihat error message

### Web Browser:
1. Buka DevTools (F12)
2. Buka Console tab
3. Coba register
4. Lihat console logs dan error

---

## 🔍 Debug Checklist

Cek satu per satu:

- [ ] Backend running? (lihat "Server berjalan di port 5000")
- [ ] MySQL running? (bisa login dengan `mysql -u root -p`)
- [ ] Database `lintara` exists? (lihat di `SHOW DATABASES`)
- [ ] API_BASE_URL benar di `constants/api.ts`?
- [ ] Firewall allow port 5000?
- [ ] Tidak ada typo di `.env`?

---

## 🚨 Common Errors & Fixes

### ❌ "Tidak dapat terhubung ke server"

**Cause:** API_BASE_URL wrong atau backend not running

**Fix:**
1. Check backend running: `npm run dev` di backend folder
2. Update API_BASE_URL di `constants/api.ts`
3. Reload app (kalau web: Ctrl+Shift+R)

---

### ❌ "Database gagal terhubung"

**Cause:** MySQL not running atau credentials wrong

**Fix:**
1. Start MySQL service
2. Check `backend/.env` DB credentials
3. Run backend again: `npm run dev`

---

### ❌ "ER_BAD_DB_ERROR"

**Cause:** Database `lintara` tidak exists

**Fix:**
```bash
mysql -u root -p lintara < "lintara (2).sql"
```

---

### ❌ "PROTOCOL_CONNECTION_LOST"

**Cause:** MySQL disconnected atau timeout

**Fix:**
1. Restart MySQL
2. Restart backend
3. Try again

---

## 🎯 Correct Setup Order

1. **Start MySQL** ← Important!
   ```bash
   # Windows: Start MySQL80 service
   # macOS: brew services start mysql
   # Linux: sudo systemctl start mysql
   ```

2. **Verify .env** in backend folder
   - Check DB credentials

3. **Start Backend**
   ```bash
   cd backend
   npm run dev
   # Wait for "Server berjalan di port 5000"
   ```

4. **Update Frontend**
   - Edit `constants/api.ts` API_BASE_URL

5. **Start Frontend**
   ```bash
   npx expo start
   # Pick platform (a/i/w)
   ```

6. **Test in App**
   - Try register/login
   - Check console for logs

---

## 📊 Complete Debugging Flow

```
App tries to register
           ↓
Send POST to API_ENDPOINTS.register
           ↓
Frontend console shows: "📤 Sending registration request to: [URL]"
           ↓
Network request sent to backend
           ↓
Backend receives request (check backend console)
           ↓
Backend queries MySQL
           ↓
Backend sends response
           ↓
Frontend receives response (check frontend console: "📨 Response data: ...")
           ↓
Show success or error alert
```

---

## 💾 Quick Test Script

### Windows - Copy paste ke CMD:
```batch
@echo off
echo Testing Backend...
curl http://localhost:5000/
echo.
echo If you see {"success":true...} the backend is working!
pause
```

### macOS/Linux:
```bash
echo "Testing Backend..."
curl http://localhost:5000/
echo ""
echo "If you see {\"success\":true...} the backend is working!"
```

---

## 🎯 Next Steps

1. Follow the checklist above ✓
2. Check ALL console logs (frontend + backend)
3. Try simple test with curl first
4. Then test in app

Biasanya masalahnya:
- ❌ Backend not running
- ❌ MySQL not running
- ❌ Wrong API_BASE_URL
- ❌ Port 5000 blocked by firewall

Sudah coba semua? Share error message dari:
1. Backend console
2. Frontend console
3. API_BASE_URL value di `constants/api.ts`
