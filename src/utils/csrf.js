import { randomBytes } from "crypto";

// Generér CSRF token (CSPRNG)
export function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

//console.log(generateCsrfToken())
/*
Problem:
En bruger er logget ind →
→ besøger ondsindet side →
→ den side sender request til din API
→ cookie følger med →
→ server tror det er legit

Løsning:

Tilføj CSRF token

- genereres per session
- sendes til frontend
- skal sendes tilbage i request
- valideres på server
*/