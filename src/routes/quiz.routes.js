import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { requireCsrf } from "../middleware/csrf.middleware.js";
import {
  getAllQuizzes,
  uploadQuiz,
  deleteQuiz,
  startQuiz,
  finishQuiz,
  getAllQuizAttempts,
  getUserQuizAttempts,
  getOwnAttempts,
} from "../controllers/quiz.controller.js";
const router = express.Router();

// Hent alle quizzer i frontend-sikker version.
// Her fjernes correctAnswers, og spørgsmål/svarmuligheder mixes.
router.get("/", requireAuth, getAllQuizzes);

// Upload ny quizfil.
// Kun admin må gøre dette.
router.post("/upload", requireAuth, requireRole("admin"), requireCsrf, uploadQuiz);

// Start et quizforsøg.
// Opretter et attempt i din logger/store og returnerer attemptId til klienten.
router.post("/:quizId/start", requireAuth, requireCsrf, startQuiz);

// Aflever quiz.
// Bruger attemptId fra dit flow og retter svarene på serveren.
router.post("/finish", requireAuth, requireCsrf, finishQuiz);

//til admin, så de kan se alle test forsøg / quiz attempts
router.get("/quizAttempts", requireAuth, requireRole("admin"), getAllQuizAttempts);

//til admin, så de kan se en specifik brugers test forsøg / quiz attempts
router.get("/quizAttempts/:username", requireAuth, requireRole("admin"), getUserQuizAttempts);

//Til at få sine egne quizforsøg
router.get('/ownAttempts', requireAuth, getOwnAttempts);

// Slet quizfil.
// Kun admin må gøre dette.
router.delete("/:quizId", requireAuth, requireRole("admin"), requireCsrf, deleteQuiz);

export default router;