import fs from "fs/promises";
import path from "path";

// Path til filen hvor alle quiz-attempts / logs gemmes.
const attemptsFile = path.resolve("data/quiz-attempts.json");

// Hent alle attempts.
// Hvis filen ikke findes endnu, returnerer vi bare et tomt array.
export async function getQuizAttempts() {
  try {
    const data = await fs.readFile(attemptsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Gem hele listen af attempts tilbage til filen.
export async function saveQuizAttempts(attempts) {
  await fs.writeFile(attemptsFile, JSON.stringify(attempts, null, 2));
}

// Opret et nyt attempt.
// Bruges når en bruger starter en quiz.
export async function createQuizAttempt(attempt) {
  const attempts = await getQuizAttempts();

  attempts.push(attempt);

  await saveQuizAttempts(attempts);

  return attempt;
}

// Find ét specifikt attempt ud fra attemptId.
// Bruges når quizzen skal afleveres.
export async function findQuizAttemptById(attemptId) {
  const attempts = await getQuizAttempts();

  return attempts.find((attempt) => attempt.attemptId === attemptId);
}

// Opdatér et eksisterende attempt.
// Bruges når quizzen afsluttes og vi skal gemme score, sluttid osv.
export async function updateQuizAttempt(updatedAttempt) {
  const attempts = await getQuizAttempts();

  const index = attempts.findIndex(
    (attempt) => attempt.attemptId === updatedAttempt.attemptId
  );

  // Hvis vi ikke finder attemptet, returnerer vi null.
  if (index === -1) {
    return null;
  }

  // Erstat det gamle attempt med det opdaterede.
  attempts[index] = updatedAttempt;

  await saveQuizAttempts(attempts);

  return updatedAttempt;
}