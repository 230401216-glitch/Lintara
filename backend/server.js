require("./config/env");

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { initializeDatabase } = require("./initDatabase");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const travelRoutes = require("./routes/travelRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const driverRoutes = require("./routes/driverRoutes");

const app = express();

// Disable version disclosure
app.disable("x-powered-by");

// Restrict CORS to safe origins
app.use(
  cors({
    origin:
      process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:5000",
        "http://192.168.1.181:5000",
      ],
    credentials: true,
  })
);
app.use(express.json());

// TEST API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Lintara Aktif",
  });
});

// AUTH API
app.use("/api/auth", authRoutes);

// Public uploads
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// TRAVEL API
app.use("/api/travels", travelRoutes);

// DRIVER API
app.use("/api/drivers", driverRoutes);

// BOOKING API
app.use("/api/bookings", bookingRoutes);

// PAYMENT API
app.use("/api/payments", paymentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error("Gagal memulai server:", error.message || error);
    process.exit(1);
  }
};

void startServer();
