import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { generateToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/register
 * Registers a new user and returns a signed JWT.
 */
router.post("/register", async (req, res) => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.format(),
    });
  }

  const { email, password } = parseResult.data;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: "Email already registered",
        message: "An account with this email address already exists.",
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email, passwordHash });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: String(user._id),
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      error: "Registration failed",
      message: err.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Validates credentials and returns a signed JWT.
 */
router.post("/login", async (req, res) => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parseResult.error.format(),
    });
  }

  const { email, password } = parseResult.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Incorrect email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Incorrect email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      message: "Login successful",
      user: {
        id: String(user._id),
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      error: "Login failed",
      message: err.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Protected endpoint returning current user info.
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "The requested user account does not exist.",
      });
    }

    return res.json({
      user: {
        id: String(user._id),
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch user",
      message: err.message,
    });
  }
});

/**
 * POST /api/auth/logout
 * Stateless JWT logout.
 */
router.post("/logout", (_req, res) => {
  return res.json({
    message: "Logged out successfully",
  });
});

export default router;

