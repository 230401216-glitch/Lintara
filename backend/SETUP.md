# Backend Setup Guide

## Prerequisites
- Node.js v16+ and npm
- MySQL/MariaDB server running
- Postman (optional, for testing APIs)

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database
- Make sure your MySQL/MariaDB server is running
- Create database: `lintara`
- Import the SQL file: `lintara (2).sql`

```bash
mysql -u root -p lintara < "lintara (2).sql"
```

### 3. Setup Environment Variables
- Copy `.env.example` to `.env`
- Edit `.env` with your configuration:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lintara
JWT_SECRET=your_secure_secret_key_here
```

### 4. Start Backend Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run at `http://localhost:5000`

## Available Endpoints

### Authentication
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/google` - Google OAuth login

### Travels
- **GET** `/api/travels` - Get all travels
- **GET** `/api/travels/:id` - Get travel by ID
- **GET** `/api/travels/routes` - Get routes
- **GET** `/api/travels/schedules` - Get schedules
- **GET** `/api/travels/schedules/:scheduleId/seats` - Get available seats

### Bookings (Requires Authentication)
- **POST** `/api/bookings` - Create booking
- **GET** `/api/bookings` - Get user bookings
- **GET** `/api/bookings/:bookingId` - Get booking details
- **DELETE** `/api/bookings/:bookingId` - Cancel booking

### Payments (Requires Authentication)
- **POST** `/api/payments/process` - Process payment
- **GET** `/api/payments/:bookingId` - Get payment status

## Testing Endpoints

Using cURL:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"John","email":"john@example.com","no_hp":"081234567890","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get Travels
curl http://localhost:5000/api/travels
```

## Database Schema

The database includes the following main tables:
- **users** - User accounts
- **travels** - Travel companies
- **routes** - Travel routes
- **schedules** - Travel schedules
- **bookings** - User bookings
- **booking_seats** - Booked seats
- **tickets** - Tickets generated for bookings
- **payments** - Payment records
- **mitra_profiles** - Travel partner profiles
- **notifications** - User notifications

## Troubleshooting

### Database Connection Error
- Ensure MySQL/MariaDB is running
- Check DB credentials in `.env`
- Verify database name is `lintara`

### JWT Token Error
- Check `JWT_SECRET` is set in `.env`
- Don't leave it as default value in production

### CORS Issues
- CORS is enabled for all origins
- Modify in `server.js` for production security

## Security Notes
- Always use strong JWT_SECRET in production
- Change default password values
- Implement rate limiting for production
- Use HTTPS in production
- Validate all user inputs
