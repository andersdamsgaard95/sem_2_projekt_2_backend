// Middleware der kræver, at brugeren er logget ind.
export async function requireAuth(req, res, next) {
  try {
    if (!req.session.user) {
      // Hvis der ikke ligger en bruger i sessionen, er brugeren ikke logget ind.
      return res.status(401).json({
        message: "Not authenticated",
      });
    }
    req.user = req.session.user;


    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

// Middleware til role-base access control, RBAC. Bruges fx som requireRole("admin").
export function requireRole(requiredRole) {
  //requiredRole er den adgangsgivende rolle, som så enten er user eller admin.
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
}
