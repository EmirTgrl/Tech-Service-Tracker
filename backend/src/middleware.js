const jwt = require("jsonwebtoken");
const prisma = require("./db");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!req.user) {
        return req.status(401).json({ error: "Invalid token: user not found" });
      }

      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res
        .status(401)
        .json({ error: "Unauthorized access: Token invalid or expired" });
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized access: Token not found. Please log in" });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ error: "System error: User not found" });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          error: `Forbidden: This operation requires the ${roles.join(
            " or "
          )} permission.`,
        });
    }

    next();
  };
};

module.exports = { protect, authorize };
