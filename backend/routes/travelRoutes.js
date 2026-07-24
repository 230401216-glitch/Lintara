const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const travelController = require("../controllers/travelController");
const { authenticate, authorize } = require("../middleware/auth");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "..", "uploads"));
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      cb(null, `${timestamp}-${safeName}`);
    },
  }),
});

// Public routes - no authentication required
router.get("/", travelController.getTravels);
router.get("/routes", travelController.getRoutes);
router.post("/routes", authenticate, authorize(["mitra", "admin"]), travelController.createRoute);
router.put("/routes/:id", authenticate, authorize(["mitra", "admin"]), travelController.updateRoute);
router.get("/schedules", travelController.getSchedules);
router.post("/schedules", authenticate, authorize(["mitra", "admin"]), travelController.createSchedule);
router.put("/schedules/:id", authenticate, authorize(["mitra", "admin"]), travelController.updateSchedule);
router.get("/schedules/:scheduleId/seats", travelController.getAvailableSeats);
router.post("/", authenticate, authorize(["mitra", "admin"]), travelController.createTravel);
router.put("/:id/photo", authenticate, authorize(["mitra", "admin"]), upload.single("foto"), travelController.uploadTravelPhoto);
router.put("/:id", authenticate, authorize(["mitra", "admin"]), travelController.updateTravel);
router.get("/:id", travelController.getTravelById);

module.exports = router;
