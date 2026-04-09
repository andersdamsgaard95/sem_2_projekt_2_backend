import express from "express";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import {
  login,
  logout,
  register,
  getCsrfToken,
  me,
  getAllUsers
} from "../controllers/auth.controller.js";
import { requireCsrf } from "../middleware/csrf.middleware.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rate-limit.middleware.js";

const router = express.Router();

// POST /auth/register
router.post("/register", registerLimiter, validate(registerSchema), register);

// POST /auth/login
router.post("/login", loginLimiter, validate(loginSchema), login);

// Hent CSRF token for den aktive session.
router.get("/csrf-token", getCsrfToken);

// Hent current user.
router.get("/me", requireAuth, me);

// Log ud.
router.post("/logout", requireAuth, requireCsrf, logout);

//til admin, for at se alle registrerede users
router.get('/allUsers', requireAuth, requireRole('admin'), getAllUsers);

// Test-route kun for loggede brugere.
router.get("/protected", requireAuth, (req, res) => {
  return res.json({
    message: "You are logged in som dødelig",
    user: req.user
  });
});

// Test-route kun for admin.
router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  return res.json({
    message: "Godmorgen chefen. Du er admin.",
    user: req.user
  });
});

// Test-route med CSRF.
router.post("/protected", requireCsrf, (req, res) => {
  res.json({ message: "CSRF check passed" });
});

export default router;