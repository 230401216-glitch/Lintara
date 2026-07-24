# 🔧 Troubleshooting Backend Connection

## ❌ Tidak Bisa Terhubung ke Server - Solusi

### Step 1: Cek Backend Running

**Terminal 1 - Buka folder backend:**
```bash
cd backend
npm run dev
```

**Expected output:**
```
MySQL terhubung
Server berjalan di port 5000
```

Jika ada error, lanjut ke Step 2.

---

### Step 2: Verifikasi MySQL Connection

**Pastikan MySQL running:**

**Windows:**
```bash
# Buka Services
# Cari "MySQL80" atau "MariaDB"
# Pastikan status "Running"
```

**macOS:**
```bash
# Jika pakai Homebrew
brew services list
# Jika tidak running:
brew services start mysql
```

**Linux:**
```bash
sudo systemctl status mysql
# Jika tidak running:
sudo systemctl start mysql
```

**Test database connection:**
```bash
mysql -u root -p
# Masukkan password (biarkan kosong jika tidak ada)

# Di MySQL console:
SHOW DATABASES;
USE lintara;
SHOW TABLES;
```

✅ Jika bisa lihat tabel-tabel, database OK.

---

### Step 3: Verifikasi .env File

**Check file:** `backend/.env`

```bash
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        # Sesuai password MySQL Anda
DB_NAME=lintara

JWT_SECRET=lintara_rahasia_2026
```

⚠️ **Common Issues:**
- `DB_PASSWORD` salah → Ganti dengan password MySQL Anda
- `DB_NAME` bukan `lintara` → Buat database atau import SQL
- Spasi/tab di awal → Hapus

**Test backend dengan curl:**
```bash
curl http://localhost:5000/
```

Expected response:
```json
{
  "success": true,
  "message": "Backend Lintara Aktif"
}
```

---

### Step 4: Verifikasi Frontend API Configuration

**Check file:** `constants/api.ts`

**Untuk Android Emulator:**
```typescript
const API_BASE_URL = "http://10.0.2.2:5000";
```

**Untuk iOS Simulator:**
```typescript
const API_BASE_URL = "http://localhost:5000";
```

**Untuk Real Device:**
```bash
# Cari IP address komputer Anda:
# Windows - buka CMD:
ipconfig

# Cari "IPv4 Address" (misal: 192.168.x.x)
# Kemudian di constants/api.ts:
const API_BASE_URL = "http://192.168.x.x:5000";
```

**Untuk Web/ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Di terminal baru:
ngrok http 5000

# Copy URL dari output dan gunakan di API_BASE_URL
```

---

### Step 5: Check Firewall

**Windows Firewall:**
```bash
# Buka Windows Defender Firewall with Advanced Security
# Inbound Rules → New Rule
# Port: 5000
# Allow connections
```

**macOS:**
```bash
# System Preferences → Security & Privacy → Firewall
# Allow port 5000
```

---

### Step 6: Check Console Logs

**Backend Console:**
- Lihat error message saat server start
- Jika ada error database, gunakan Step 2

**Frontend Console:**
1. **Android Emulator:**
   - Buka Android Studio Logcat
   - Filter: "lintara" atau "fetch"

2. **iOS Simulator:**
   - Buka Xcode Console

3. **Web:**
   - Buka DevTools (F12)
   - Lihat Network tab saat klik login

---

### Step 7: Test API Endpoints

**Buka terminal baru dan test:**

```bash
# Test 1: Cek server berjalan
curl -i http://localhost:5000

# Test 2: Test register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama":"Test User",
    "email":"test@example.com",
    "no_hp":"081234567890",
    "password":"password123"
  }'

# Test 3: Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'

# Test 4: Get travels
curl http://localhost:5000/api/travels
```

Expected: JSON responses dari semua endpoint

---

## 🎯 Complete Setup Checklist

- [ ] MySQL running dan database `lintara` exists
- [ ] `backend/.env` configured dengan DB credentials yang benar
- [ ] Backend running dengan `npm run dev` (tanpa error)
- [ ] `curl http://localhost:5000/` return success response
- [ ] Frontend API_BASE_URL updated sesuai environment
- [ ] Firewall allow port 5000
- [ ] Frontend bisa connect ke backend (test dengan register/login)

---

## 🚀 Quick Start Sequence

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Tunggu sampai "Server berjalan di port 5000"
```

**Terminal 2 - Frontend:**
```bash
cd ..
npx expo start
# Pilih platform (a/i/w)
```

**Test di App:**
1. Navigate ke Login
2. Coba login/register
3. Lihat console di backend untuk request logs

---

## 📊 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `connect ECONNREFUSED` | Backend not running | Run `npm run dev` di backend |
| `getaddrinfo ENOTFOUND localhost` | Wrong API_BASE_URL | Update constants/api.ts |
| `PROTOCOL_CONNECTION_LOST` | MySQL disconnected | Start MySQL service |
| `ER_ACCESS_DENIED_FOR_USER` | Wrong DB password | Check .env DB_PASSWORD |
| `ER_BAD_DB_ERROR` | Database not exists | Import SQL file |
| `ECONNREFUSED 10.0.2.2:5000` | Emulator can't reach host | Restart emulator, check firewall |
| `Network Error` di app | Firewall blocking | Add port 5000 to firewall whitelist |

---

## 💡 Debug Tips

1. **Lihat Network Activity:**
   - Browser DevTools → Network tab
   - Lihat request URL dan status

2. **Backend Logs:**
   - Semua request log di terminal backend
   - Lihat method, endpoint, response status

3. **Enable Debug Mode:**
   - Backend: Tambah `console.log()` di controllers
   - Frontend: Tambah `console.log()` di API calls

4. **Test dengan Postman:**
   - Import endpoints dari API_DOCUMENTATION.md
   - Test setiap endpoint secara manual

5. **Restart Everything:**
   - Stop backend (Ctrl+C)
   - Stop frontend
   - Stop MySQL
   - Start semua lagi dari awal

---

## 📞 Jika Masih Error

Buka terminal backend dan copy-paste error message untuk saya analisis lebih lanjut.

Atau sertakan:
1. Output dari `npm run dev` di backend
2. API_BASE_URL value di `constants/api.ts`
3. Content dari `backend/.env`
4. Error message dari frontend console
