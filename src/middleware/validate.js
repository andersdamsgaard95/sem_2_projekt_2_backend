//____________
// Middleware der validerer input med Zod
//____________
export const validate = (schema) => (req, res, next) => {
  // Forsøg at parse input
  const result = schema.safeParse(req.body);

  // Hvis validering fejler
  if (!result.success) {
    return res.status(400).json({
      message: "Invalid input"
    });
  }

  // Whitelisting:
  // Vi erstatter req.body med KUN de validerede felter
  req.validatedData = result.data;

  next();
};

