const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticate, authorize } = require("../middleware/auth");

// Protected routes - authentication required
router.post("/", authenticate, bookingController.createBooking);
// Only mitra should access the aggregated bookings list
router.get("/all", authenticate, authorize(["mitra"]), bookingController.getAllBookings);
router.post("/tickets/scan", authenticate, authorize(["mitra", "admin"]), bookingController.scanTicket);
router.get("/", authenticate, bookingController.getUserBookings);
router.get("/:bookingId", authenticate, bookingController.getBookingById);
router.delete("/:bookingId", authenticate, bookingController.cancelBooking);

module.exports = router;
