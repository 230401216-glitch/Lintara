# 🚀 Quick Setup Checklist

Ikuti langkah-langkah ini untuk menjalankan aplikasi Lintara:

## ✅ Prerequisites
- [ ] Node.js v16+ terinstall (`node -v` untuk check)
- [ ] npm terinstall (`npm -v` untuk check)
- [ ] MySQL/MariaDB running
- [ ] Git (optional)

## 📦 Setup Backend

### Step 1: Database Setup
```bash
# Connect ke MySQL
mysql -u root -p

# Create database
CREATE DATABASE lintara;
USE lintara;

# Import SQL file
mysql -u root -p lintara < "lintara (2).sql"
```
- [ ] Database created
- [ ] SQL file imported successfully

### Step 2: Backend Installation
```bash
cd backend
npm install
```
- [ ] Dependencies installed (check `node_modules` folder exists)

### Step 3: Environment Configuration
```bash
cd backend
cp .env.example .env
```

Edit `.env` file:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lintara
JWT_SECRET=your_secret_key_here
```
- [ ] `.env` file created
- [ ] Database credentials updated
- [ ] JWT_SECRET set

### Step 4: Start Backend
```bash
cd backend
npm run dev
```

Expected output:
```
MySQL Connected
Server berjalan di port 5000
```
- [ ] Backend running at port 5000
- [ ] No connection errors

## 📱 Setup Frontend

### Step 1: Installation
```bash
# Go to project root
cd ..
npm install
```
- [ ] Frontend dependencies installed

### Step 2: Configure API URL

Edit `constants/api.ts` dan sesuaikan `API_BASE_URL`:

**For Android Emulator:**
```typescript
const API_BASE_URL = "http://10.0.2.2:5000";
```

**For iOS Simulator:**
```typescript
const API_BASE_URL = "http://localhost:5000";
```

**For Real Device:**
```typescript
const API_BASE_URL = "http://YOUR_MACHINE_IP:5000";
```

Replace `YOUR_MACHINE_IP` dengan IP address komputer Anda (cek dengan `ipconfig` di Windows)

- [ ] API_BASE_URL updated correctly

### Step 3: Update Google OAuth (Optional)

Edit `app/register.tsx` dan ganti:
- `GOOGLE_CLIENT_ID`
- `ANDROID_CLIENT_ID`
- `IOS_CLIENT_ID`

Get credentials dari [Google Cloud Console](https://console.cloud.google.com/)

- [ ] Google OAuth credentials updated (atau skip jika tidak perlu)

### Step 4: Start Frontend
```bash
npx expo start
```

Pilih platform:
- **Android**: Press `a` (requires Android Studio/Emulator)
- **iOS**: Press `i` (requires macOS)
- **Web**: Press `w`

- [ ] Expo server running

## 🧪 Testing

### Test Backend Endpoints

```bash
# Test 1: Check server running
curl http://localhost:5000

# Test 2: Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama":"Test User",
    "email":"test@example.com",
    "no_hp":"081234567890",
    "password":"password123"
  }'

# Test 3: Get travels
curl http://localhost:5000/api/travels
```

- [ ] Server responds correctly
- [ ] Registration works
- [ ] API endpoints accessible

### Test Frontend

1. Open Expo app di device/emulator
2. Test login dengan credentials:
   - Email: `test@example.com`
   - Password: `password123`

3. Test main features:
   - [ ] Home page loads
   - [ ] Can see travel options
   - [ ] Can select route and schedule
   - [ ] Can select seats
   - [ ] Can input passenger info
   - [ ] Can process booking

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check MySQL running, .env credentials correct |
| **Database connection error** | Verify MySQL, check `DB_HOST`, `DB_USER`, `DB_PASSWORD` |
| **Frontend can't connect to backend** | Check API_BASE_URL in `constants/api.ts` matches backend port |
| **Android emulator can't reach backend** | Use `10.0.2.2` instead of `localhost` |
| **TypeScript errors** | Run `npm install`, clear node_modules and reinstall |
| **Google OAuth error** | Update OAuth credentials in `app/register.tsx` |

## 📚 Documentation

- **Frontend Setup**: See [README.md](./README.md)
- **Backend Setup**: See [backend/SETUP.md](./backend/SETUP.md)
- **Changes Summary**: See [FIXES_SUMMARY.md](./FIXES_SUMMARY.md)

## 🎯 Success Checklist

- [ ] MySQL running with `lintara` database
- [ ] Backend server running at port 5000
- [ ] Frontend running in Expo
- [ ] Can log in with test credentials
- [ ] Can view travels and bookings
- [ ] Backend responds to API calls

## 💡 Tips

1. Keep backend terminal open while testing frontend
2. Use Postman for API testing
3. Check browser console in web version for errors
4. Use `npm run dev` untuk backend development (auto-restart)
5. Clear Expo cache if having issues: `expo start --clear`

## 📞 Getting Help

Jika ada error:
1. Check console logs di terminal (backend) dan device (frontend)
2. Verify API_BASE_URL matches your setup
3. Ensure all ports are not blocked by firewall
4. Try clearing cache and reinstalling dependencies

---

**Status**: ✅ Ready to develop!

Jika semua checklist sudah diisi, aplikasi Anda siap untuk development dan testing.
