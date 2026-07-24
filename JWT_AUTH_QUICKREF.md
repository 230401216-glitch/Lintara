# JWT Authentication Quick Reference

## Quick Start

### 1. Configure Environment

**Backend (.env)**:
```env
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
DB_PASSWORD=your_password
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:8081
```

**Frontend (.env)**:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.32:5000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### 2. Start Backend & Frontend

```bash
# Backend
cd backend && npm run dev

# Frontend
npm start
```

### 3. Test Login

- **Email/Password**: Register → Login → Auto-login on restart
- **Google**: Click "Login with Google" → Select account → Auto-login

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| TokenService | `lib/services/tokenService.ts` | Secure token storage (SecureStore) |
| AuthContext | `lib/context/AuthContext.tsx` | Global auth state & JWT management |
| apiClient | `lib/services/apiClient.ts` | API calls with JWT auto-injection |
| JWT Middleware | `backend/middleware/auth.js` | Token verification & role checking |

## Authentication Flow

```
User Login → Backend returns JWT → Frontend saves to SecureStore
    ↓
App Restart → Read token from SecureStore → Verify with /api/auth/me
    ↓
If valid → Auto-login (show dashboard) | If invalid → Show login
```

## API Calls

### With JWT Auto-Injection
```typescript
import { apiGet, apiPost } from "@/lib/services/apiClient";

// Automatic JWT in header
const bookings = await apiGet("/api/bookings");
const booking = await apiPost("/api/bookings", { schedule_id: 1, seats: 2 });
```

### Manual API Calls
```typescript
import { API_ENDPOINTS } from "@/constants/api";
import * as TokenService from "@/lib/services/tokenService";

const token = await TokenService.getToken();
const response = await fetch(API_ENDPOINTS.getBookings, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Roles & Permissions

| Role | Permissions | Login Route |
|------|-------------|------------|
| **user** | View travels, book tickets, view bookings | `/(tabs)` |
| **mitra** | Manage armada, drivers, schedules | `/(mitra)/dashboard` |
| **admin** | Review mitras, reports, user management | `/(admin)/panel` |

## Protected Endpoints

All endpoints starting with `/api/` require JWT except:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/travels` (list only)
- `GET /api/travels/:id` (view only)

## Testing Checklist

- [ ] Backend .env configured with JWT_SECRET
- [ ] Frontend .env configured with API_BASE_URL
- [ ] Backend starts without errors: `npm run dev`
- [ ] Frontend can register new user
- [ ] Frontend can login with email/password
- [ ] JWT token visible in SecureStore
- [ ] App restarts and auto-logs in
- [ ] Google login works (if Google credentials configured)
- [ ] Protected API endpoints require JWT header
- [ ] Role-based access control works (admin/mitra/user)

## Deployment Checklist

- [ ] Generate new JWT_SECRET for production
- [ ] Use HTTPS for all API calls
- [ ] Update ALLOWED_ORIGINS to production domains
- [ ] Configure Google OAuth for production app
- [ ] Test all auth flows in production build
- [ ] Monitor auth endpoint errors
- [ ] Set up token refresh mechanism if needed
- [ ] Regular security audit of .env files

## Common Issues

| Issue | Solution |
|-------|----------|
| "Token tidak ditemukan" | Check login was successful, JWT saved to SecureStore |
| "Token tidak valid" | Verify JWT_SECRET matches in all .env files |
| Google login fails | Ensure development build (not Expo Go), verify Client IDs |
| Auto-login not working | Check backend /api/auth/me endpoint is responding |
| Protected route returns 401 | Verify apiClient is used or JWT in Authorization header |

## Files Modified

✅ **package.json** - Added expo-secure-store  
✅ **lib/services/tokenService.ts** - NEW - SecureStore wrapper  
✅ **lib/services/apiClient.ts** - NEW - API client with JWT  
✅ **lib/context/AuthContext.tsx** - UPDATED - JWT + SecureStore  
✅ **app/index.tsx** - UPDATED - Auto-login logic  
✅ **backend/.env.example** - UPDATED - Complete config template  
✅ **.env.example** - UPDATED - Google OAuth credentials  

## Documentation

📖 **JWT_AUTH_SETUP.md** - Complete setup guide with all details
📖 **JWT_AUTH_QUICKREF.md** - This file (quick reference)

## Security Notes

⚠️ **JWT_SECRET**: Generate random 32+ character string, never commit to git  
⚠️ **Google Credentials**: Keep in .env, never commit to git  
⚠️ **Tokens**: Stored securely in SecureStore (encrypted at OS level)  
⚠️ **HTTPS**: Always use HTTPS in production  
⚠️ **Expiration**: Current tokens expire after 7 days

## Support

For detailed setup, testing, and troubleshooting:
→ See **JWT_AUTH_SETUP.md**
