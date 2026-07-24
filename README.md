# Lintara - Travel Booking Application

Lintara adalah aplikasi mobile untuk pemesanan tiket perjalanan dengan fitur pembayaran, manajemen pesanan, dan integrasi Google OAuth.

## 🎯 Fitur Utama

- 📱 Booking tiket perjalanan
- 🎫 Pembelian tiket dengan QR code
- 💳 Pembayaran (Cash & QRIS)
- 👤 Manajemen profil pengguna
- 🔐 Autentikasi dengan Email/Google
- 📊 Riwayat pesanan
- 🪑 Pemilihan kursi

## 📋 Struktur Proyek

```
lintara/
├── app/                      # Frontend (React Native/Expo)
│   ├── (tabs)/              # Tab navigation
│   ├── context/             # Context API (Auth)
│   ├── login.tsx
│   ├── register.tsx
│   └── pesan.tsx
├── backend/                 # Node.js/Express API
│   ├── config/             # Database config
│   ├── controllers/        # API logic
│   ├── middleware/         # Auth middleware
│   ├── routes/             # API routes
│   └── server.js
├── components/             # Reusable components
├── constants/              # Constants & config
│   ├── theme.ts
│   └── api.ts
└── hooks/                  # Custom hooks
```

## 🛠️ Technology Stack

### Frontend
- React Native 0.81.5
- Expo 54.0.34
- Expo Router (Navigation)
- React Context API (State Management)
- TypeScript

### Backend
- Node.js
- Express.js
- MySQL/MariaDB
- JWT (Authentication)
- bcryptjs (Password hashing)

## 🚀 Quick Start

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL in `constants/api.ts`:
```typescript
// For local development on Android emulator:
const API_BASE_URL = "http://10.0.2.2:5000";

// For iOS simulator:
const API_BASE_URL = "http://localhost:5000";

// For real device:
const API_BASE_URL = "http://YOUR_MACHINE_IP:5000";
```

3. Start the app:
```bash
# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run on web
npx expo start --web
```

### Backend Setup

See [Backend Setup Guide](./backend/SETUP.md) for detailed instructions.

```bash
cd backend
npm install

# Configure .env
cp .env.example .env
# Edit .env with your database credentials

# Start server
npm run dev  # Development with nodemon
npm start    # Production
```

## 🔧 Environment Configuration

### Frontend
- API Base URL: `constants/api.ts`
- Google OAuth IDs: `app/register.tsx`

### Backend
- Database: `.env`
- JWT Secret: `.env`
- Server Port: `.env` (default: 5000)

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth

### Travels
- `GET /api/travels` - Get all travels
- `GET /api/travels/:id` - Get travel details
- `GET /api/travels/routes` - Get routes
- `GET /api/travels/schedules` - Get schedules
- `GET /api/travels/schedules/:scheduleId/seats` - Get available seats

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:bookingId` - Get booking details
- `DELETE /api/bookings/:bookingId` - Cancel booking

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/:bookingId` - Get payment status

## 🗄️ Database

Database schema includes:
- users
- travels
- routes
- schedules
- bookings
- booking_seats
- tickets
- payments
- mitra_profiles
- notifications

Import database:
```bash
mysql -u root -p lintara < "lintara (2).sql"
```

## 🔒 Authentication

- JWT token-based authentication
- Password hashing with bcryptjs
- Google OAuth integration (optional)
- Token expires in 7 days

## 📝 Important Notes

1. **Backend URL Configuration**:
   - Update `constants/api.ts` for correct backend URL
   - Android emulator: `http://10.0.2.2:5000`
   - iOS simulator: `http://localhost:5000`
   - Real device: Use your machine's IP address

2. **Database Setup**:
   - Ensure MySQL is running
   - Create database `lintara`
   - Import SQL file
   - Update `.env` credentials

3. **Google OAuth**:
   - Get OAuth credentials from Google Cloud Console
   - Update in `app/register.tsx`

## 🐛 Common Issues

### Backend Connection Error
- Check API_BASE in `constants/api.ts`
- Ensure backend server is running
- Check firewall settings

### Database Connection Error
- Verify MySQL is running
- Check `.env` credentials
- Confirm database is imported

### TypeScript Errors
- Run `npm install` in both frontend and backend
- Clear cache: `expo prebuild --clean`

## 📦 Dependencies

### Frontend
```json
{
  "expo": "~54.0.34",
  "react-native": "0.81.5",
  "react": "19.1.0",
  "expo-router": "~6.0.23",
  "@react-navigation/bottom-tabs": "^7.4.0"
}
```

### Backend
```json
{
  "express": "^5.2.1",
  "mysql2": "^3.22.5",
  "bcryptjs": "^3.0.3",
  "jsonwebtoken": "^9.0.3"
}
```

## 🚀 Deployment

### Frontend
- Build APK: `eas build --platform android`
- Build IPA: `eas build --platform ios`
- Web: `npx expo export --platform web`

### Backend
- Deploy to Node.js hosting (Heroku, Railway, etc.)
- Update API_BASE_URL in frontend
- Set environment variables on host

## 📄 License

MIT License

## 👥 Support

For issues and questions, please check the documentation or create an issue in the repository.

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
