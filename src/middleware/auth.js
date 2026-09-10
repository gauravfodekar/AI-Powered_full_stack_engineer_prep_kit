import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Generates a signed JWT token for a user.
 *
 * @param {string} userId - User's MongoDB ID
 * @param {string} [expiresIn="7d"] - Expiration duration
 * @returns {string} Signed JWT
 */
export function generateToken(userId, expiresIn = "7d") {
  return jwt.sign({ userId: String(userId) }, env.JWT_SECRET, { expiresIn });
}

/**
 * Verifies a JWT token.
 *
 * @param {string} token - JWT string
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Express middleware that enforces authentication.
 * Protects endpoints from unauthenticated visitors and attaches `req.userId`.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Please log in to access this resource.",
    });
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res.status(401).json({
      error: isExpired ? "Session expired" : "Invalid session",
      message: isExpired
        ? "Your session has expired. Please log in again."
        : "Session token is invalid or corrupt.",
    });
  }
}

