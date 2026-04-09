import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import Ajv from "ajv";
import { shuffle } from "../utils/shuffle.js";
import {
  findQuizById,
  getAllQuizzes as getAllQuizzesFromStore,
  saveQuiz,
  deleteQuizById
} from "../utils/quiz-store.js";
import {
  createQuizAttempt,
  findQuizAttemptById,
  updateQuizAttempt,
  getQuizAttempts
} from "../utils/quiz-attempt-store.js";
import { calculateQuizResult } from "../utils/quiz-result.js";
import {
  sanitizeQuizText,
  sanitizeAttemptQuestions,
} from "../utils/sanitize.js";
// Path til quiz-schemafilen.
const quizSchemaPath = path.resolve("src/validationSchemas/quizFileSchema.json");

// Indlæs schema én gang ved opstart.
const quizSchema = JSON.parse(await fs.readFile(quizSchemaPath, "utf-8"));

// AJV bruges til at validere quizfilens struktur før den gemmes.
const ajv = new Ajv({
  allErrors: true
});

const validateQuizSchema = ajv.compile(quizSchema);

/**
 * Fjerner correctAnswers fra en quiz,
 * så klienten ikke får facit med ud før aflevering.
 *
 * Samtidig mixes:
 * - spørgsmålene
 * - svarmulighederne i de spørgsmål der har options
 */
function toFrontendQuiz(quiz) {
  return {
    id: quiz.id,
    title: sanitizeQuizText(quiz.title),
    questions: shuffle(
      quiz.questions.map((question) => {
        const { correctAnswers, ...safeQuestion } = question;

        safeQuestion.question = sanitizeQuizText(safeQuestion.question);

        if (Array.isArray(safeQuestion.options)) {
          safeQuestion.options = shuffle(
            safeQuestion.options.map(opt => ({
              ...opt,
              text: sanitizeQuizText(opt.text)
            }))
          );
        }

        return safeQuestion;
      })
    )
  };
}

// FÅ ÉN QUIZ
// Returnerer én quiz i frontend-sikker version uden correctAnswers.
export async function getQuizById(req, res) {
  try {
    const { quizId } = req.params;

    const quiz = await findQuizById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    return res.json(toFrontendQuiz(quiz));
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// FÅ ALLE QUIZZER
// Returnerer alle quizzer i frontend-sikker version uden correctAnswers.
export async function getAllQuizzes(req, res) {
  try {
    const quizzes = await getAllQuizzesFromStore();

    const safeQuizzes = quizzes.map((quiz) => toFrontendQuiz(quiz));

    return res.json(safeQuizzes);
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}


// UPLOAD QUIZ
// Kun admin må uploade.
// Quizfilen valideres med AJV før den gemmes.
export async function uploadQuiz(req, res) {
  try {
    const quiz = req.body;

    const valid = validateQuizSchema(quiz);

    if (!valid) {
      return res.status(400).json({
        message: "Invalid quiz file",
        errors: validateQuizSchema.errors
      });
    }

    await saveQuiz(quiz);

    return res.status(201).json({
      message: "Quiz uploaded successfully",
      quizId: quiz.id
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// SLET QUIZ
// Kun admin må slette.
export async function deleteQuiz(req, res) {
  try {
    const { quizId } = req.params;

    const deleted = await deleteQuizById(quizId);

    if (!deleted) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    return res.json({
      message: "Quiz deleted successfully",
      quizId
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// START QUIZ
// Opretter et nyt attempt og logger startdata.
export async function startQuiz(req, res) {
  try {
    // Hent quizId fra URL'en, fx /quizzes/datasikkerhed/start
    const { quizId } = req.params;

    // Hent den bruger der er logget ind via session.
    const user = req.user;

    // Find quizzen på serveren.
    const quiz = await findQuizById(quizId);

    // Hvis quizzen ikke findes, returnér 404.
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    // Opret attempt-objektet.
    // Det er denne record, der bruges til logging og resultat bagefter.
    const attempt = {
      attemptId: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      role: user.role,
      quizId: quiz.id,
      quizTitle: quiz.title,
      startedAt: Date.now(),
      finishedAt: null,
      totalTimeMs: null,
      score: null,
      maxScore: null,

      // Her gemmer vi det færdige spørgsmål-for-spørgsmål resultat efter aflevering.
      answers: null,
    };

    // Gem attemptet i quiz-attempts.json.
    await createQuizAttempt(attempt);

    // Send attemptId tilbage til klienten.
    // Klienten skal sende det med ved aflevering.
    return res.status(201).json({
      attemptId: attempt.attemptId
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// FINISH QUIZ
// Modtager attemptId + answers, finder quizzen via dit eksisterende attempt,
// beregner score på serveren, logger resultatet i dit attempt, og returnerer resultatet til frontend.
export async function finishQuiz(req, res) {
  try {
    const { attemptId, answers } = req.body;
    // attemptId skal være der, og answers skal være et objekt eller array.
    if (!attemptId || !answers || typeof answers !== "object") {
      return res.status(400).json({
        message: "attemptId og answers mangler eller har ugyldigt format"
      });
    }
    // Find attemptet fra din logger/store.
    const attempt = await findQuizAttemptById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        message: "Quiz attempt not found"
      });
    }
    // Blokér dobbelt aflevering.
    if (attempt.finishedAt) {
      return res.status(400).json({
        message: "Quiz already submitted"
      });
    }
    // brugeren må kun afslutte sit eget attempt.
    if (attempt.userId !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }
    // Hent quizId fra attemptet, ikke fra klienten. Dermed kan klienten ikke skifte quiz ved aflevering.
    const quiz = await findQuizById(attempt.quizId);
    // Hvis admin har slettet quizzen i mellemtiden, returnér 404.
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    const result = calculateQuizResult(quiz, answers);
    const safeQuestions = sanitizeAttemptQuestions(result.questions);

    const finishedAt = Date.now();
    // Opdatér attemptet med det endelige resultat.
    attempt.finishedAt = finishedAt;
    attempt.totalTimeMs = finishedAt - attempt.startedAt;
    attempt.score = result.totalScore;
    attempt.maxScore = result.maxScore;
    attempt.answers = safeQuestions;
    // Skriv det opdaterede attempt tilbage til logger/store.
    await updateQuizAttempt(attempt);
    // Send resultatet tilbage i det format frontend skal bruge.
    return res.json({
      message: "Quiz finished",
      attemptId: attempt.attemptId,
      quizId: attempt.quizId,
      quizTitle: sanitizeQuizText(attempt.quizTitle),
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      totalTimeMs: attempt.totalTimeMs,
      score: attempt.score,
      maxScore: attempt.maxScore,
      questions: safeQuestions
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// Returnerer alle quiz attempts
export async function getAllQuizAttempts(req, res) {
  try {
    const attempts = await getQuizAttempts();

    return res.json(attempts);
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// Returnerer alle quiz attempts
export async function getUserQuizAttempts(req, res) {
  try {
    const { username } = req.params;

    const wholeLogFile = await getQuizAttempts();

    const usersAttemts = wholeLogFile.filter(attempts => {
      return attempts.username === username;
    })

    return res.json(usersAttemts);
  } catch (err) {
    return res.status(500).json({
      message: "Server error"
    });
  }
}

// Returnerer en logget ind brugers egne quiz forsøg
export async function getOwnAttempts(req, res) {
  try {
    const username = req.user.username;

    const wholeLogFile = await getQuizAttempts();

    const usersAttemts = wholeLogFile.filter(attempts => {
      return attempts.username === username;
    })

    return res.json(usersAttemts);
  } catch (error) {
    console.error(err);
    return res.status(500).json({
      message: "Server error"
    });
  }
}