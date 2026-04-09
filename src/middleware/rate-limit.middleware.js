import rateLimit from "express-rate-limit";

// Baseline limiter til hele appen. Den beskytter mod alt for mange requests generelt.
export const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutter vindue.
  limit: 300,   // Maksimalt 300 requests pr. IP i dette tidsvindue.
  standardHeaders: "draft-7",   // Sender moderne rate limit headers tilbage.
  legacyHeaders: false,   // Slå de gamle headers fra.
  message: {
    message: "Too many requests"   // Besked hvis grænsen er nået.
  }
});

// Login limiter pr. IP til log in
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutters vindue.
  limit: 10,   // Maks 10 loginforsøg pr. IP i vinduet.
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts"
  }
});

// Register limiter. Beskytter mod masseoprettelse af brugere og bot-spam.
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts"
  }
});