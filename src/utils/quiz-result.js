
//Gør tekstsvar sammenlignelige ved at: sikre string, trimme whitespace væk i start/slut,
function normalizeText(value) {
  return String(value ?? "").trim();
}

//Bygger et map fra option-id -> option-tekst. Bruges så frontend kan få tekst tilbage i resultatet i stedet for kun ids.
function buildOptionMap(options = []) {
  const optionMap = {};

  for (const option of options) {
    optionMap[option.id] = option.text;
  }

  return optionMap;
}

//Finder brugerens svar til ét spørgsmål. 
function getSubmittedAnswer(userAnswers, questionId) {
  if (userAnswers && !Array.isArray(userAnswers) && typeof userAnswers === "object") {
    return userAnswers[questionId];
  }

  //slet: // Dit gamle format
  // if (Array.isArray(userAnswers)) {
  //   const submitted = userAnswers.find((answer) => answer.questionId === questionId);
  //   return submitted ? submitted.answer : null;
  // }

  return null;
}

/**
 * Beregner resultatet for en hel quiz.
 *
 * Pointmodel:
 * - single: 1 eller 0
 * - text: 1 eller 0
 * - multiple: +0.5 pr korrekt valgt svar, -0.5 pr forkert valgt svar
 *
 * Vi klamper ikke negative multiple-points væk, fordi projektbeskrivelsen netop lægger op til pointfradrag. 
 */
export function calculateQuizResult(quiz, userAnswers) {
  let totalScore = 0;
  let maxScore = quiz.questions.length;

  const questions = quiz.questions.map((question) => {
    const submittedAnswer = getSubmittedAnswer(userAnswers, question.id);
    const correctAnswers = Array.isArray(question.correctAnswers)
      ? question.correctAnswers
      : [];

    const optionMap = buildOptionMap(question.options ?? []);

    let points = 0;
    let userAnswer = [];
    let isCorrect = false;

    // TEXT-spørgsmål:
    // sammenlignes case-insensitivt efter trim.
    if (question.type === "text") {
      const submittedText =
        typeof submittedAnswer === "string" ? submittedAnswer : "";

      const correctText =
        typeof correctAnswers[0] === "string" ? correctAnswers[0] : "";

      isCorrect = normalizeText(submittedText) === normalizeText(correctText);
      points = isCorrect ? 1 : 0;
      userAnswer = submittedText ? [submittedText] : [];
    }

    // SINGLE choice:
    // ét korrekt svar giver 1 point, ellers 0.
    else if (question.type === "single") {
      const submittedValue =
        typeof submittedAnswer === "string" ? submittedAnswer : "";

      isCorrect = submittedValue === correctAnswers[0];
      points = isCorrect ? 1 : 0;
      userAnswer = submittedValue ? [optionMap[submittedValue] || submittedValue] : [];
    }

    // MULTIPLE choice:
    // +0.5 for korrekt valgt svar
    // -0.5 for forkert valgt svar
    else if (question.type === "multiple") {
      const submittedValues = Array.isArray(submittedAnswer) ? submittedAnswer : [];
      const userSet = new Set(submittedValues);
      const correctSet = new Set(correctAnswers);

      for (const answerId of userSet) {
        if (correctSet.has(answerId)) {
          points += 0.5;
        } else {
          points -= 0.5;
        }
      }

      // Fuldt korrekt kun hvis brugerens valg præcist matcher facit.
      isCorrect =
        submittedValues.length === correctAnswers.length &&
        submittedValues.every((value) => correctSet.has(value));

      userAnswer = submittedValues.map((value) => optionMap[value] || value);
    }

    const correctAnswerTexts =
      question.type === "text"
        ? correctAnswers
        : correctAnswers.map((value) => optionMap[value] || value);

    totalScore += points;

    return {
      id: question.id,
      question: question.question,
      type: question.type,
      userAnswer,
      correctAnswers: correctAnswerTexts,
      isCorrect,
      points
    };
  });

  return {
    totalScore,
    maxScore,
    questions
  };
}