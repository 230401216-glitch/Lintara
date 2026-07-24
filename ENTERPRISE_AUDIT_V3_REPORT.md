# Enterprise Audit V3 - Lintara

## 1. Ringkasan Audit

Audit dilakukan terhadap source project di luar `node_modules`, `.git`, `.expo`, `dist`, `build`, `coverage`, `android/build`, dan `ios/build`. `lintara.sql` digunakan sebagai single source of truth. Referensi Expo SDK 54 dibuka sebelum perubahan kode: https://docs.expo.dev/versions/v54.0.0/

Status akhir: project belum boleh disebut 100% sinkron karena fitur Review, Notification, Wallet, Withdrawal, Banner, Settings, dan QR Scan sebelumnya belum memiliki CRUD/API penuh. Patch sudah diterapkan untuk bug sinkronisasi booking, driver, payment, route update, scan ticket, personal profile, dan logout.

## 2. Inventarisasi Project

- Backend: `server.js`, `initDatabase.js`, `config/db.js`, `middleware/auth.js`, routes auth/travel/booking/payment/driver, controllers auth/travel/booking/payment/driver.
- Frontend screens: root, tabs home/pesanan/profile, mitra dashboard/booking/scan/profile/armada/jadwal/harga/supir, login/register/search/travel-detail/pesan/payment/ticket/personal-data/promo/onboarding/modal.
- Services/context: `AuthContext`, `bookingStore`, `mitraData`, `googleAuth`, `data/travel`.
- Components: themed components, haptic/external link, UI icon/collapsible, mitra cards.
- Assets: app icons, splash, travel images.
- Navigation: Expo Router stacks/tabs in `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(mitra)/_layout.tsx`.

## 3. Audit Database

Tabel terverifikasi dari `lintara.sql`: `users`, `mitra_profiles`, `travels`, `routes`, `schedules`, `bookings`, `booking_seats`, `tickets`, `ticket_scans`, `payments`, `drivers`, `reviews`, `notifications`, `activity_logs`, `banners`, `settings`, `wallet_transactions`, `withdrawals`.

ERD tekstual:
- `users.id` -> `mitra_profiles.user_id`, `bookings.user_id`, `notifications.user_id`, `ticket_scans.scanned_by`
- `mitra_profiles.id` -> `travels.mitra_id`, `payments.mitra_id`, `withdrawals.mitra_id`
- `travels.id` -> `routes.travel_id`, `reviews.travel_id`
- `routes.id` -> `schedules.route_id`
- `schedules.id` -> `bookings.schedule_id`
- `bookings.id` -> `booking_seats.booking_id`, `tickets.booking_id`, `payments.booking_id`, `reviews.booking_id`
- `tickets.id` -> `ticket_scans.ticket_id`

Temuan database:
- `drivers.mitra_id` tidak memiliki FK/index di `lintara.sql`; secara aplikasi sekarang diperlakukan sebagai `mitra_profiles.id`.
- `activity_logs`, `banners`, `settings`, `wallet_transactions`, `withdrawals`, `reviews`, `notifications` belum memiliki endpoint CRUD lengkap.
- `bookings` memiliki pasangan kolom legacy/baru: `kode_booking/booking_code`, `status_pembayaran/payment_status`, `status_booking/approval_status`, `ticket_code`; backend sudah dipatch agar kolom baru ikut terisi.

## 4. Audit Backend

- `authController`: register/login/google memakai `users` dan `mitra_profiles`; bcrypt/JWT OK; belum ada rate limit.
- `travelController`: travel/route/schedule memakai tabel benar; `updateRoute` sudah dipatch agar tidak menulis `routes.status` yang tidak ada.
- `bookingController`: create booking sudah transaction; cancel belum transaction untuk seats/payment/ticket; get bookings masih N+1 seats; scan ticket baru ditambahkan dengan transaction.
- `paymentController`: payment update belum transaction; mitra ownership sudah dipatch ke `mitra_profiles.id`.
- `driverController`: `mitra_id` sudah dipatch agar resolve ke `mitra_profiles.id`.
- `initDatabase`: bootstrap schema tidak membuat FK/index seperti dump SQL; untuk production tetap import `lintara.sql`.

## 5. Audit Frontend

- Auth login/register/google memakai endpoint tersedia.
- Home/search/travel-detail memakai katalog backend dengan fallback static; jika fallback dipakai, booking dapat gagal karena route id static tidak ada di DB.
- Booking/payment/ticket memakai booking store dan API booking/payment.
- Mitra armada/harga/jadwal/supir/booking memakai endpoint tersedia.
- Scan QR sudah dipatch agar memanggil `/api/bookings/tickets/scan` dan mencatat `ticket_scans`.
- Personal Data sudah dipatch agar memakai user auth, bukan dummy.

## 6. Audit API

| Method | URL | Controller | Middleware | Database | Status |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | auth.register | none | users, mitra_profiles | OK |
| POST | `/api/auth/login` | auth.login | none | users | OK |
| POST | `/api/auth/google` | auth.googleLogin | none | users | OK |
| GET | `/api/travels` | travel.getTravels | none | travels, mitra_profiles | OK |
| POST | `/api/travels` | travel.createTravel | mitra/admin | travels | OK |
| PUT | `/api/travels/:id` | travel.updateTravel | mitra/admin | travels | OK |
| GET | `/api/travels/routes` | travel.getRoutes | none | routes | OK |
| POST | `/api/travels/routes` | travel.createRoute | mitra/admin | routes | OK |
| PUT | `/api/travels/routes/:id` | travel.updateRoute | mitra/admin | routes | OK patched |
| GET | `/api/travels/schedules` | travel.getSchedules | none | schedules, routes | OK |
| POST | `/api/travels/schedules` | travel.createSchedule | mitra/admin | schedules | OK |
| PUT | `/api/travels/schedules/:id` | travel.updateSchedule | mitra/admin | schedules | OK |
| GET | `/api/travels/schedules/:scheduleId/seats` | travel.getAvailableSeats | none | schedules, booking_seats, bookings | OK |
| POST | `/api/bookings` | booking.createBooking | auth | bookings, seats, tickets, payments | OK patched |
| GET | `/api/bookings` | booking.getUserBookings | auth | bookings | OK, N+1 |
| GET | `/api/bookings/all` | booking.getAllBookings | mitra/admin | bookings | OK, N+1 |
| GET | `/api/bookings/:bookingId` | booking.getBookingById | auth | bookings | OK |
| DELETE | `/api/bookings/:bookingId` | booking.cancelBooking | auth | bookings | BUG: partial cancellation |
| POST | `/api/bookings/tickets/scan` | booking.scanTicket | mitra/admin | tickets, ticket_scans | OK patched |
| POST | `/api/payments/process` | payment.processPayment | auth | payments, bookings | BUG: no transaction |
| GET | `/api/payments/:bookingId` | payment.getPaymentStatus | auth | payments | OK user only |
| GET/POST/PUT | `/api/drivers` | driverController | mixed | drivers | OK patched |

## 7. Audit Security

OK: parameterized SQL, bcrypt, JWT middleware, role middleware for mutation endpoints.  
BUG/Risk: no Helmet, no rate limiter, no refresh token, token stored in AsyncStorage, no central request validation, CORS depends on env, `.env` exists in workspace and must not be committed.

## 8. Audit Performance

N+1 query: booking seat loading in `getAllBookings` and `getUserBookings`.  
Repeated API: `loadMitraDashboardData` loads travels/routes/schedules/bookings/drivers together for pages that only need one subset.  
Missing index candidate: `drivers.mitra_id`, `ticket_scans.scanned_by`, `reviews.user_id`, `reviews.travel_id`.

## 9. Audit Code Quality

Backend controllers are direct SQL/controller mixed; acceptable for small app, technical debt for enterprise. `resolveMitraProfileId` duplicated across controllers. Frontend service mapping is centralized enough, but booking cache mixes offline/local/server state and can hide backend failures.

## 10. CRUD Matrix

| Modul | Create | Read | Update | Delete |
|---|---|---|---|---|
| User | OK | Login only | BELUM ADA | BELUM ADA |
| Admin | BELUM ADA | BELUM ADA | BELUM ADA | BELUM ADA |
| Mitra profile | register only | session only | BELUM ADA | BELUM ADA |
| Driver | OK | OK | OK | BELUM ADA |
| Travel | OK | OK | OK | BELUM ADA |
| Route | OK | OK | OK | BELUM ADA |
| Schedule | OK | OK | OK | BELUM ADA |
| Booking | OK | OK | cancel only | BUG partial |
| Payment | process only | OK | process only | BELUM ADA |
| Wallet | BELUM ADA | BELUM ADA | BELUM ADA | BELUM ADA |
| Withdrawal | BELUM ADA | BELUM ADA | BELUM ADA | BELUM ADA |
| Review | BELUM ADA | BELUM ADA | BELUM ADA | BELUM ADA |
| Notification | BELUM ADA | frontend synthetic only | BELUM ADA | BELUM ADA |
| Banner | BELUM ADA | BELUM ADA | BELUM ADA | BELUM ADA |
| Settings | BELUM ADA | BELUM ADA | BELUM ADA | BELUM ADA |

## 11. API Matrix

Lihat bagian 6. Tidak ada endpoint untuk review, notification, wallet, withdrawal, banner, settings, user profile update, atau real admin dashboard.

## 12. Daftar Bug

P1:
- Payment process belum transaction; bisa update `payments` berhasil tetapi `bookings` gagal.
- Cancel booking hanya update `bookings.status_booking`, tidak update seats/payment/ticket.

P2:
- Booking list N+1 query seats.
- Static catalog fallback dapat membuat booking gagal jika route id tidak ada di DB.

P3:
- Personal Data sebelumnya hard-coded, sudah patched.
- Logout Android sebelumnya keluar app sebelum clear auth, sudah patched.
- Scan QR sebelumnya tidak mencatat `ticket_scans`, sudah patched.

## 13. Daftar File Bermasalah

- `backend/controllers/bookingController.js`: transaction create OK, scan patched, cancel masih partial.
- `backend/controllers/paymentController.js`: role ownership patched, transaction payment belum ada.
- `backend/controllers/driverController.js`: mitra id patched.
- `backend/controllers/travelController.js`: route status patched.
- `app/(mitra)/scan.tsx`: scan API patched.
- `app/personal-data.tsx`: dummy data patched.
- `app/(tabs)/profile.tsx`: logout patched.
- `data/travel.tsx`: fallback static masih risk.

## 14. Patch Lengkap

Patch diterapkan langsung pada:
- `backend/controllers/bookingController.js`
- `backend/routes/bookingRoutes.js`
- `constants/api.ts`
- `app/(mitra)/scan.tsx`
- `app/personal-data.tsx`
- `app/(tabs)/profile.tsx`
- Patch sebelumnya pada `driverController.js`, `paymentController.js`, `travelController.js`, `bookingController.js`

## 15. Cara Pengujian

1. Import `lintara.sql`.
2. Start backend: `cd backend && npm start`.
3. Register mitra, buat armada, route, schedule.
4. Register user, booking schedule, proses payment.
5. Login mitra, buka Booking dan Scan QR.
6. Scan dengan `kode_tiket`/`kode_booking`; verifikasi `tickets.status='digunakan'` dan row baru di `ticket_scans`.
7. Jalankan negative tests: scan tiket belum paid, scan tiket dua kali, scan mitra lain, token kosong, token role user.

## 16. Validasi Akhir

Perintah yang sudah berhasil:
- `node --check backend/controllers/bookingController.js`
- `node --check backend/routes/bookingRoutes.js`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`

Catatan: `expo lint` hanya memberi warning ESLintIgnoreWarning dari ESLint v9 terkait `.eslintignore`.

## 17. Persentase Sinkronisasi

- Database -> Backend: 76%
- Backend -> API: 82%
- API -> Frontend: 78%
- Frontend -> Database: 70%
- Keseluruhan project: 76%

Angka ini bukan 100% karena CRUD pendukung belum ada, payment/cancel belum transaction penuh, dan belum ada pengujian langsung database/server berjalan di environment ini.

## 18. Kesimpulan

Lintara sudah memiliki fondasi booking-travel-mitra yang berjalan, tetapi belum enterprise-ready. Prioritas berikutnya: transaction payment/cancel, CRUD profile/review/notification/wallet/withdrawal, hilangkan fallback static untuk booking produksi, optimasi N+1 seats, tambah rate limiter/Helmet/validation, dan samakan bootstrap schema dengan `lintara.sql`.
