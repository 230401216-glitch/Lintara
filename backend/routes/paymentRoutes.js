const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

// Protected routes - authentication required
router.post("/process", authenticate, paymentController.processPayment);
router.get("/:bookingId", authenticate, paymentController.getPaymentStatus);

module.exports = router;
