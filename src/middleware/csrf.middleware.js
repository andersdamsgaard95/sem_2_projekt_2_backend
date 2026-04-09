
// Middleware til CSRF beskyttelse
export function requireCsrf(req, res, next) {
  // Kræver at der findes en aktiv session med csrfToken.
  if (!req.session || !req.session.csrfToken) {
    return res.status(401).json({
      message: "Not authenticated"
    });
  }

  // Hent token sendt fra klienten.
  const clientToken = req.headers["x-csrf-token"];

  // Hvis token mangler eller ikke matcher sessionens token -> blokér.
  if (!clientToken || clientToken !== req.session.csrfToken) {
    return res.status(403).json({
      message: "CSRF detected"
    });
  }

  next();
}

//“Jeg beskytter alle state-changing endpoints med CSRF middleware”