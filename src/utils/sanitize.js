import sanitizeHtml from "sanitize-html";

export function sanitizeQuizText(input) {
  return sanitizeHtml(String(input ?? ""), {
    allowedTags: ["strong", "br", "span", "em"],
    allowedAttributes: {
      span: ["style"]
    },
    allowedStyles: {
      "*": {
        "font-style": [/^italic$/],
        "text-decoration": [/^underline$/]
      }
    }
  });
}

export function sanitizePlainText(input) {
  return sanitizeHtml(String(input ?? ""), {
    allowedTags: [],
    allowedAttributes: {}
  });
}

export function sanitizeAttemptQuestions(questions = []) {
  return questions.map((q) => ({
    ...q,
    question: sanitizeQuizText(q.question),
    userAnswer: Array.isArray(q.userAnswer)
      ? q.userAnswer.map((value) => sanitizePlainText(value))
      : [],
    correctAnswers: Array.isArray(q.correctAnswers)
      ? q.correctAnswers.map((value) => sanitizeQuizText(value))
      : []
  }));
}

export function sanitizeAttempt(attempt) {
  return {
    ...attempt,
    quizTitle: sanitizeQuizText(attempt.quizTitle),
    username: sanitizePlainText(attempt.username),
    answers: Array.isArray(attempt.answers)
      ? sanitizeAttemptQuestions(attempt.answers)
      : attempt.answers
  };
}