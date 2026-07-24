const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};

exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const normalizedUserRole = String(req.user.role || "").trim().toLowerCase();
    const normalizedRoles = roles.map((role) => String(role).trim().toLowerCase());

    if (roles.length > 0 && !normalizedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses ke resource ini",
      });
    }

    next();
  };
};
