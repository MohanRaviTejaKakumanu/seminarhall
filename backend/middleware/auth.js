const jwt = require("jsonwebtoken");

const auth = (roles = []) => {
  if (typeof roles === "string") roles = [roles];

  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization; 
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "No token, authorization denied" });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret123"
      );

      // decoded contains: id, userId, role
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ msg: "Forbidden: insufficient role" });
      }

      next();
    } catch (err) {
      return res.status(401).json({ msg: "Token is not valid" });
    }
  };
};

module.exports = auth;
