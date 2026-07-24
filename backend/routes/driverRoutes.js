const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", driverController.getDrivers);
router.post("/", authenticate, authorize(["mitra", "admin"]), driverController.createDriver);
router.put("/:id", authenticate, authorize(["mitra", "admin"]), driverController.updateDriver);

module.exports = router;
