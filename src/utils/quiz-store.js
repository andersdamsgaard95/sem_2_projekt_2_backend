import fs from "fs/promises";
import path from "path";

// Mappe hvor quizfiler ligger.
// Vi samler alt quiz-filarbejde her, så controlleren holder sig mere ren.
const quizzesFolder = path.resolve("data/quizFiles");

/**
 * Sørger for at quiz-mappen findes.
 * recursive: true gør, at den ikke fejler hvis mappen allerede findes.
 */
async function ensureQuizzesFolder() {
  await fs.mkdir(quizzesFolder, { recursive: true });
}

/**
 * Returnerer den fulde sti til en quizfil ud fra quizId.
 */
function getQuizFilePath(quizId) {
  return path.join(quizzesFolder, `${quizId}.json`);
}

/**
 * Finder én quiz ud fra quizId.
 * Returnerer null hvis filen ikke findes eller ikke kan læses.
 */
export async function findQuizById(quizId) {
  const filePath = getQuizFilePath(quizId);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Henter alle quizzer fra quiz-mappen.
 * Returnerer altid et array.
 */
export async function getAllQuizzes() {
  await ensureQuizzesFolder();

  const fileNames = await fs.readdir(quizzesFolder);
  const quizzes = [];

  for (const fileName of fileNames) {
    // Vi ignorerer alt der ikke er JSON-filer.
    if (!fileName.endsWith(".json")) continue;

    const filePath = path.join(quizzesFolder, fileName);
    const fileData = await fs.readFile(filePath, "utf-8");
    const quiz = JSON.parse(fileData);

    quizzes.push(quiz);
  }

  return quizzes;
}

/**
 * Gemmer en quiz som JSON-fil.
 * Filnavnet bliver quizId.json
 */
export async function saveQuiz(quiz) {
  await ensureQuizzesFolder();

  const filePath = getQuizFilePath(quiz.id);

  await fs.writeFile(filePath, JSON.stringify(quiz, null, 2));

  return quiz;
}

/**
 * Sletter en quizfil ud fra quizId.
 * Returnerer true hvis filen blev slettet.
 * Returnerer false hvis filen ikke fandtes.
 */
export async function deleteQuizById(quizId) {
  const filePath = getQuizFilePath(quizId);

  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }

    throw err;
  }
}