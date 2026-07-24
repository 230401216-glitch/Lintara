# 📚 Lintara API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
Most endpoints require Bearer token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### 1. Register User
```
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama": "John Doe",
  "email": "john@example.com",
  "no_hp": "081234567890",
  "password": "password123"
}
```

**Validation Rules:**
- `nama`: Required, string
- `email`: Required, valid email format
- `no_hp`: Required, format: 62xxx or 0xxx (8-12 digits)
- `password`: Required, minimum 6 characters

**Response (Success):**
```json
{
  "success": true,
  "message": "Register berhasil",
  "user_id": 1
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email sudah digunakan"
}
```

---

### 2. Login User
```
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nama": "John Doe",
    "email": "john@example.com",
    "no_hp": "081234567890",
    "role": "user",
    "status": "aktif",
    "foto": null
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Password salah"
}
```

---

### 3. Google OAuth Login
```
POST /api/auth/google
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama": "John Doe",
  "email": "john@example.com",
  "photo": "https://example.com/photo.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "nama": "John Doe",
    "email": "john@example.com",
    "no_hp": "",
    "role": "user",
    "status": "aktif",
    "foto": "https://example.com/photo.jpg"
  }
}
```

---

## 🚌 Travel Endpoints (Public)

### 1. Get All Travels
```
GET /api/travels
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "mitra_id": 1,
      "nama_travel": "PT. Maju Jaya",
      "deskripsi": "Travel terpercaya...",
      "ac": 1,
      "seat_layout": "2-2",
      "foto": "https://...",
      "status": "aktif",
      "nomor_kendaraan": "B1234XYZ",
      "jumlah_kursi": 20,
      "nama_perusahaan": "PT. Maju Jaya"
    }
  ]
}
```

---

### 2. Get Travel by ID
```
GET /api/travels/:id
```

**Example:** `GET /api/travels/1`

**Response:** Same as single travel object from get all travels

---

### 3. Get Routes
```
GET /api/travels/routes?travelId=1
```

**Query Parameters:**
- `travelId` (optional): Filter by travel ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "travel_id": 1,
      "asal": "Jakarta",
      "tujuan": "Bandung",
      "harga": 150000,
      "durasi": "3 jam"
    }
  ]
}
```

---

### 4. Get Schedules
```
GET /api/travels/schedules?routeId=1&date=2026-06-26
```

**Query Parameters:**
- `routeId` (optional): Filter by route ID
- `date` (optional): Filter by date (YYYY-MM-DD format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "route_id": 1,
      "tanggal": "2026-06-26",
      "jam_berangkat": "08:00:00",
      "total_kursi": 20,
      "status": "aktif",
      "asal": "Jakarta",
      "tujuan": "Bandung",
      "harga": 150000
    }
  ]
}
```

---

### 5. Get Available Seats
```
GET /api/travels/schedules/:scheduleId/seats
```

**Example:** `GET /api/travels/schedules/1/seats`

**Response:**
```json
{
  "success": true,
  "total_kursi": 20,
  "booked_seats": [1, 2, 5, 8],
  "available_seats": [3, 4, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
}
```

---

## 🎫 Booking Endpoints (Protected)

### 1. Create Booking
```
POST /api/bookings
Authorization: Bearer TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "schedule_id": 1,
  "seats": [3, 4, 5],
  "nama_penumpang": "John Doe",
  "no_hp_penumpang": "081234567890",
  "lokasi_jemput": "Halte Terminal Central",
  "metode_pembayaran": "qris",
  "tipe_bus": "AC"
}
```

**Validation Rules:**
- `schedule_id`: Required, must exist
- `seats`: Required, array of integers
- `nama_penumpang`: Required, string
- `no_hp_penumpang`: Required, string
- `metode_pembayaran`: Required, "cash" or "qris"

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "booking_id": 1,
    "kode_booking": "BK1719334215123456",
    "total_harga": 450000,
    "metode_pembayaran": "qris"
  }
}
```

---

### 2. Get User Bookings
```
GET /api/bookings
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode_booking": "BK1719334215123456",
      "user_id": 1,
      "schedule_id": 1,
      "jumlah_tiket": 3,
      "total_harga": 450000,
      "metode_pembayaran": "qris",
      "status_booking": "confirmed",
      "status_pembayaran": "paid",
      "created_at": "2026-06-26T10:30:00.000Z",
      "nama_penumpang": "John Doe",
      "no_hp_penumpang": "081234567890",
      "asal": "Jakarta",
      "tujuan": "Bandung",
      "tanggal": "2026-06-27",
      "jam_berangkat": "08:00:00",
      "kode_tiket": "TK1719334215",
      "seats": [3, 4, 5]
    }
  ]
}
```

---

### 3. Get Booking by ID
```
GET /api/bookings/:bookingId
Authorization: Bearer TOKEN
```

**Example:** `GET /api/bookings/1`

**Response:** Same booking object as in get all bookings

---

### 4. Cancel Booking
```
DELETE /api/bookings/:bookingId
Authorization: Bearer TOKEN
```

**Example:** `DELETE /api/bookings/1`

**Response:**
```json
{
  "success": true,
  "message": "Booking berhasil dibatalkan"
}
```

---

## 💳 Payment Endpoints (Protected)

### 1. Process Payment
```
POST /api/payments/process
Authorization: Bearer TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "booking_id": 1,
  "payment_method": "qris"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Pembayaran berhasil",
  "data": {
    "booking_id": 1,
    "status": "paid",
    "ticket_code": "TK1719334215"
  }
}
```

---

### 2. Get Payment Status
```
GET /api/payments/:bookingId
Authorization: Bearer TOKEN
```

**Example:** `GET /api/payments/1`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "booking_id": 1,
    "amount": 450000,
    "metode": "qris",
    "payment_reference": "REF123456",
    "status": "paid",
    "paid_at": "2026-06-26T11:00:00.000Z",
    "created_at": "2026-06-26T10:30:00.000Z"
  }
}
```

---

## 📊 Status Values

### Booking Status
- `pending` - Booking dibuat, menunggu pembayaran
- `confirmed` - Pembayaran sukses, booking dikonfirmasi
- `cancelled` - Booking dibatalkan

### Payment Status
- `pending` - Menunggu pembayaran
- `paid` - Pembayaran sukses
- `failed` - Pembayaran gagal

### User Status
- `aktif` - User aktif
- `nonaktif` - User dinonaktifkan

### Travel Status
- `aktif` - Travel aktif
- `nonaktif` - Travel tidak aktif

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Semua field harus diisi"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token tidak ditemukan"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Anda tidak memiliki akses ke resource ini"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource tidak ditemukan"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 🧪 Example Request using cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "John Doe",
    "email": "john@example.com",
    "no_hp": "081234567890",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Travels
```bash
curl http://localhost:5000/api/travels
```

### Create Booking (with token)
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "schedule_id": 1,
    "seats": [3, 4, 5],
    "nama_penumpang": "John Doe",
    "no_hp_penumpang": "081234567890",
    "metode_pembayaran": "qris"
  }'
```

---

## 💡 Notes

1. All date/time responses are in ISO 8601 format
2. Prices are in Indonesian Rupiah (IDR)
3. Token expires in 7 days
4. Use appropriate HTTP methods (GET, POST, PUT, DELETE)
5. Always include `Content-Type: application/json` for requests with body
6. Protect sensitive data (tokens, passwords) in production

---

**Last Updated**: June 2026
**API Version**: 1.0
