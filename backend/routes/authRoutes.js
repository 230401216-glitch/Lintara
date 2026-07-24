const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
  getPendingMitras,
  approveMitra,
  rejectMitra,
  getReports,
  getMyProfile,
  updateMyProfile,
  applyMitra,
  getMitraProfile,
  uploadMitraDocument,
  approveMitraDocument,
  rejectMitraDocument,
  updateMitraPhoto,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} = require("../controllers/authController");
const multer = require("multer");
const path = require("path");
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

// =======================
// PUBLIC ROUTES
// =======================

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Google Login
router.post("/google", googleLogin);

// Forgot password placeholder
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email wajib diisi" });
  }

  return res.json({
    success: true,
    message: "Jika email terdaftar, instruksi reset password akan dikirimkan ke alamat Anda.",
  });
});

// Admin approval for mitra accounts
router.get("/mitra/pending", authenticate, authorize(["admin"]), getPendingMitras);
router.put("/mitra/:userId/approve", authenticate, authorize(["admin"]), approveMitra);
router.put("/mitra/:userId/reject", authenticate, authorize(["admin"]), rejectMitra);
router.get("/reports", authenticate, authorize(["admin"]), getReports);
router.put(
  "/mitra/:userId/document/approve",
  authenticate,
  authorize(["admin"]),
  approveMitraDocument
);
router.put(
  "/mitra/:userId/document/reject",
  authenticate,
  authorize(["admin"]),
  rejectMitraDocument
);

router.get("/me", authenticate, getMyProfile);
router.put("/me", authenticate, updateMyProfile);
router.put("/me/photo", authenticate, upload.single("photo"), require("../controllers/authController").updateMyPhoto);
router.put("/me/password", authenticate, require("../controllers/authController").changePassword);
router.post("/apply-mitra", authenticate, applyMitra);
router.get("/mitra/me", authenticate, authorize(["mitra"]), getMitraProfile);
router.put("/mitra/document", authenticate, authorize(["mitra"]), upload.single("document"), uploadMitraDocument);
router.put("/mitra/photo", authenticate, authorize(["mitra"]), upload.single("photo"), updateMitraPhoto);

// Admin user management
router.get("/users", authenticate, authorize(["admin"]), getAllUsers);
router.get("/users/:id", authenticate, authorize(["admin"]), getUserById);
router.put("/users/:id", authenticate, authorize(["admin"]), updateUserById);
router.delete("/users/:id", authenticate, authorize(["admin"]), deleteUserById);

module.exports = router;
