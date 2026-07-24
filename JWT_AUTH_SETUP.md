# JWT Authentication & SecureStore Implementation - Setup Guide

## Overview

This document explains the complete JWT authentication system with Expo SecureStore integration, RBAC (Role-Based Access Control), and Google OAuth login.

## Architecture

### Frontend (Expo App)
1. **SecureStore**: Secure token storage (encrypted at OS level)
2. **TokenService**: Service for token operations (save, get, clear)
3. **AuthContext**: Global auth state with JWT management
4. **Auto-login**: App checks SecureStore on startup and restores user session
5. **API Client**: Utility that automatically adds JWT to all requests

### Backend (Express.js)
1. **JWT Middleware**: Verifies token and extracts user info
2. **RBAC Middleware**: Checks user role for authorization
3. **Protected Routes**: All sensitive endpoints require middleware
4. **Google Verification**: Validates Google tokens and creates/updates users

## Setup Instructions

### Step 1: Backend Environment Configuration

1. **Copy .env template**:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generate JWT Secret** (important for security):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update `.env` file**:
   ```env
   PORT=5000
   
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=lintara
   
   # JWT (use generated secret from step 2)
   JWT_SECRET=your_generated_secret_here
   
   # CORS (add your frontend URLs)
   ALLOWED_ORIGINS=http://localhost:5000,http://localhost:8081,http://192.168.1.32:5000
   
   # Google OAuth (optional for Google login)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### Step 2: Frontend Environment Configuration

1. **Copy .env template**:
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` file**:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.32:5000
   EXPO_PUBLIC_APP_MODE=user
   
   # Google OAuth Credentials (get from Google Cloud Console)
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_REDIRECT_URI=com.lintara.app://redirect
   ```

### Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
npm install
```

## Authentication Flow

### Email/Password Login

```
User enters credentials
    ↓
Frontend: POST /api/auth/login (email, password)
    ↓
Backend: Verify password, generate JWT token
    ↓
Frontend: Save JWT + user data to SecureStore
    ↓
App navigates to dashboard
```

### Google OAuth Login

```
User clicks "Login with Google"
    ↓
Frontend: Get Google access token via Expo Auth Session
    ↓
Frontend: POST /api/auth/google (accessToken)
    ↓
Backend: Verify token with Google, check if user exists
    ├─ If exists: Update photo, generate JWT
    └─ If not: Create new user with role "user", generate JWT
    ↓
Frontend: Save JWT + user data to SecureStore
    ↓
App navigates to dashboard
```

### Auto-Login on App Startup

```
App starts
    ↓
AuthProvider: Loads token from SecureStore
    ↓
index.tsx: Calls checkAuthStatus()
    ↓
Frontend: GET /api/auth/me (with JWT header)
    ↓
Backend: Verify JWT, return user data
    ├─ If valid: Restore user session
    └─ If invalid: Clear token, show login
    ↓
App navigates to appropriate dashboard
```

## Protected Routes & Middleware

All protected endpoints require:
1. **Authorization Header**: `Bearer <JWT_TOKEN>`
2. **Valid JWT Token**: Not expired, signed with correct secret
3. **Correct Role** (for role-based endpoints)

### Route Protection Examples

```javascript
// Backend routes
app.get("/api/auth/me", authenticate, getMyProfile);
app.get("/api/bookings", authenticate, getUserBookings);
app.get("/api/mitra/me", authenticate, authorize(["mitra"]), getMitraProfile);
app.get("/api/admin/reports", authenticate, authorize(["admin"]), getReports);
```

### Frontend API Calls

Use the `apiClient` utilities for automatic JWT injection:

```typescript
import { apiGet, apiPost } from "@/lib/services/apiClient";

// GET request with JWT automatically added
const { data } = await apiGet("/api/bookings");

// POST request with JWT automatically added
const { data } = await apiPost("/api/bookings", {
  schedule_id: 1,
  seats: 2,
});
```

## Testing the Authentication System

### Test 1: Email/Password Registration

```bash
# Backend running on http://localhost:5000

POST /api/auth/register
Content-Type: application/json

{
  "nama": "Test User",
  "email": "test@example.com",
  "no_hp": "08123456789",
  "password": "password123",
  "role": "user"
}

# Expected response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nama": "Test User",
    "email": "test@example.com",
    "no_hp": "08123456789",
    "role": "user",
    "status": "aktif"
  }
}
```

### Test 2: Email/Password Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}

# Returns same response as registration
```

### Test 3: Verify JWT Token

```bash
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

# Expected response:
{
  "success": true,
  "data": {
    "id": 1,
    "nama": "Test User",
    "email": "test@example.com",
    ...
  }
}
```

### Test 4: Protected Route (Without Token)

```bash
GET /api/bookings
Content-Type: application/json

# Expected response (401 Unauthorized):
{
  "success": false,
  "message": "Token tidak ditemukan"
}
```

### Test 5: Protected Route (With Valid Token)

```bash
GET /api/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

# Expected response (200 OK):
{
  "success": true,
  "data": [...]
}
```

### Test 6: Role-Based Access Control

```bash
# Regular user trying to access admin endpoint
GET /api/auth/mitra/pending
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Expected response (403 Forbidden):
{
  "success": false,
  "message": "Anda tidak memiliki akses ke resource ini"
}
```

### Test 7: Google Login (Frontend)

1. Open the app in a development build (not Expo Go)
2. Go to login page
3. Click "Login with Google"
4. Select Google account
5. Check that JWT token is saved to SecureStore
6. Check that app navigates to dashboard

### Test 8: Auto-Login (Frontend)

1. Login successfully with email/password or Google
2. Restart the app
3. App should automatically restore user session
4. Should see dashboard without re-entering credentials

## Token Expiration & Refresh

**Current Implementation**: JWT tokens expire after 7 days

**For Production**: Consider implementing:
1. Shorter access token (15 minutes)
2. Refresh token (7 days) stored securely
3. Token refresh endpoint to get new access token

```typescript
// Example: Implement refresh token
const verifyAndRefreshToken = async () => {
  const token = await TokenService.getToken();
  // Verify token expiration
  // If near expiration, call /api/auth/refresh to get new token
  // Update SecureStore with new token
};
```

## Troubleshooting

### Issue: "Token tidak ditemukan" when calling protected endpoint

**Cause**: JWT token not in Authorization header or not saved to SecureStore

**Fix**:
1. Verify login was successful (check response contains token)
2. Verify apiClient is being used (automatically adds token)
3. Check SecureStore contains token: `TokenService.getToken()`

### Issue: "Token tidak valid" 

**Cause**: JWT_SECRET mismatch between frontend and backend

**Fix**:
1. Verify JWT_SECRET in .env matches between sessions
2. Regenerate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Update both .env files and restart servers

### Issue: Google login fails with "Token Google tidak valid"

**Cause**: 
1. Google credentials not configured in .env
2. Google token verification failed
3. App not running in development build (Expo Go doesn't support OAuth)

**Fix**:
1. Create development build: `eas build --platform android/ios --profile preview`
2. Verify Google Client IDs in .env
3. Check backend can reach googleapis.com

### Issue: App doesn't auto-login after restart

**Cause**: 
1. Token not saved to SecureStore
2. Token invalid or expired
3. checkAuthStatus() not called

**Fix**:
1. Verify login saves token: `TokenService.saveToken()`
2. Restart backend and check /api/auth/me endpoint works
3. Check app/index.tsx calls `await checkAuthStatus()`

## Security Considerations

### Production Checklist

- [ ] Use strong JWT_SECRET (minimum 32 characters, random)
- [ ] HTTPS enabled on backend (not HTTP)
- [ ] ALLOWED_ORIGINS restricted to your domains only
- [ ] Sensitive data (passwords) never logged
- [ ] Database credentials not exposed
- [ ] Google Client IDs and Secrets kept in .env (not committed)
- [ ] Token expiration set appropriately (7 days for this setup)
- [ ] Refresh token mechanism implemented for better security
- [ ] CORS policies properly configured
- [ ] Rate limiting added to auth endpoints
- [ ] Error messages don't leak sensitive info

### Best Practices

1. **Token Storage**: SecureStore is encrypted at OS level (safe)
2. **HTTPS**: Always use HTTPS in production
3. **Secret Rotation**: Periodically rotate JWT_SECRET
4. **Token Expiration**: Set appropriate expiration time
5. **Refresh Tokens**: Use refresh tokens for extended sessions
6. **Error Handling**: Don't leak implementation details in errors
7. **Input Validation**: Validate all user inputs
8. **SQL Injection**: Use prepared statements (already done with `?`)
9. **XSS Protection**: Sanitize data if used in web views
10. **CSRF**: Implement CSRF tokens for state-changing operations

## File Structure

```
Frontend:
├── lib/
│   ├── services/
│   │   ├── tokenService.ts       (SecureStore operations)
│   │   ├── apiClient.ts          (API utilities with JWT)
│   │   └── googleAuth.ts         (Google OAuth)
│   └── context/
│       └── AuthContext.tsx       (Global auth state)
├── app/
│   ├── index.tsx                 (Auto-login logic)
│   ├── login.tsx                 (Email/password login)
│   ├── register.tsx              (Email/password register)
│   └── login-mitra.tsx           (Mitra login redirect)

Backend:
├── config/
│   ├── db.js                     (Database connection)
│   └── env.js                    (Environment variables)
├── middleware/
│   └── auth.js                   (JWT & RBAC middleware)
├── controllers/
│   └── authController.js         (Login, register, Google OAuth)
├── routes/
│   ├── authRoutes.js
│   ├── travelRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   └── driverRoutes.js
└── server.js                     (Express app setup)
```

## API Endpoints Summary

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google token
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/me` - Update profile (protected)

### Mitra Endpoints (requires mitra role)
- `GET /api/auth/mitra/me` - Get mitra profile
- `PUT /api/auth/mitra/document` - Upload mitra document

### Admin Endpoints (requires admin role)
- `GET /api/auth/mitra/pending` - Get pending mitra approvals
- `PUT /api/auth/mitra/:userId/approve` - Approve mitra
- `PUT /api/auth/mitra/:userId/reject` - Reject mitra

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in console and logs
3. Verify .env files are properly configured
4. Check backend and frontend are communicating correctly
5. Review GitHub issues and documentation
