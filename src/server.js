// Importer dependencies
import dotenv from "dotenv"; //skal stå øverst
dotenv.config();

import express from "express";
import helmet from "helmet"; // Sætter sikkerhedsheaders (CSP, XSS protection osv.)
import authRoutes from "./routes/auth.routes.js";
import { baseLimiter } from "./middleware/rate-limit.middleware.js";
import session from "express-session";
import quizRoutes from "./routes/quiz.routes.js";
import cors from 'cors'; //ANDERS

// Opret express app
const app = express();
// Cors - Tillad fra frontend ANDERS
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// SECURITY: Begræns request størrelse (mod DoS)
app.use(express.json({ limit: "10kb" }));
// SECURITY: Helmet beskytter mod XSS via headers (CSP osv.)
app.use(helmet());
// Global baseline rate limiting. Beskytter hele appen mod alt for mange requests generelt.
app.use(baseLimiter);


app.use(
  session({
    secret: process.env.SESSION_SECRET, // Hemmelig nøgle til at signe session-cookien.
    resave: false, // Gem ikke session igen hvis intet er ændret.
    saveUninitialized: false, // Opret ikke tomme sessioner for anonyme brugere.
    cookie: {
      httpOnly: true, // JS i browseren kan ikke læse cookien.
      secure: false, // Skal være true i production med HTTPS.
      sameSite: "lax", // Hjælper mod CSRF. Strict i production?
      maxAge: 1000 * 60 * 60 // 1 time.
    }
  })
);

// Test route
app.get("/", (req, res) => {
  res.send("Der er forbindelse!!");
});

// Brug routes
app.use("/auth", authRoutes);

app.use("/quizzes", quizRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server kører på http://localhost:3000");
});
