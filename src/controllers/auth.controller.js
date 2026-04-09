import fs from "fs/promises";
import path from "path";
import { hashPassword } from "../utils/hash.js";
import { verifyPassword } from "../utils/hash.js";
import { generateCsrfToken } from "../utils/csrf.js"

// Path til users.json
const usersFile = path.resolve("data/users.json");

// Helper: hent brugere
const getUsers = async () => {
  try {
    const data = await fs.readFile(usersFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return []; // hvis fil ikke findes endnu
  }
};

// Helper: gem brugere
const saveUsers = async (users) => {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
};



// ___________
// REGISTER
//____________start
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.validatedData;
    const normalizedEmail = email.trim().toLowerCase();

    const users = await getUsers();

    // Tjek både username og email
    const existingUser = users.find(
      (u) => u.email === email || u.username === username
    );

    if (existingUser) {
      return res.status(400).json({
        message: "Brugernavn findes allerede. Vælg et andet" // stadig generic - undgå user enumeration. Hvis vi nu skriver: “email already exists” eller “username taken”, så ville en angriber kunne kortlægge brugere. Meeen, det her er dårlig UX faktisk.
      });
    }

    // HASH PASSWORD
    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: crypto.randomUUID(),
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user", //default - det skal så ændres til admin hvis man er admin
      createdAt: Date.now()
    };

    users.push(newUser);
    await saveUsers(users);

    res.status(201).json({
      message: "User created"
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};
// ___________
// REGISTER
//____________slut





// ___________
// LOGIN
//____________start
export const login = async (req, res) => {
  try {
    const { username, password } = req.validatedData;
    const users = await getUsers();
    const user = users.find(u => u.username === username);     // Find bruger
    const passwordOk = await verifyPassword(password, user.password);     // Verify password (argon2 + pepper)

    if (!passwordOk) {
      return res.status(401).json({
        loggedIn: false,
        message: "Invalid credentials"
      });
    }
    req.session.regenerate((err) => { //req.session.regenerate(...) betyder: “smid den gamle session væk og lav en helt ny session”. når den har "regenerate" en ny session, hvis noget går galt, så 
      // den variabel, err, der bliver returneret først, er null hvis alt gik godt, så hvis den evaluerer til noget, så bliver nedenstående if true.
      // Hvis der sker en fejl under regenerering af sessionen, returnerer vi en serverfejl.
      if (err) {
        return res.status(500).json({
          message: "Session error"
        });
      }

      req.session.user = {      // Gemmer de sikre felter vi har brug for.
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      req.session.csrfToken = generateCsrfToken();       // Gemmer CSRF token direkte i sessionen.

      res.json({
        loggedIn: true,
        message: "Login successful",
        username: user.username,
        role: user.role
      });
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error"
    });
  }
};
// ___________
// LOGIN
//____________slut





// ___________
// LOGOUT
//____________start
export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Logout failed"
      });
    }

    // Standard cookie-navn i express-session er "connect.sid", medmindre vi selv sætter et name i session-config.
    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    return res.json({
      message: "Logout successful"
    });
  });
}
// ___________
// LOGOUT
//____________slut




// ___________
// CSRF
//____________start
export function getCsrfToken(req, res) {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Not authenticated"
    });
  }

  res.json({
    csrfToken: req.session.csrfToken
  });
}
// ___________
// CSRF
//____________slut







// ___________
// ME
//____________start
// Returnér info om den bruger, der er logget ind lige nu. Denne route skal beskyttes med requireAuth, ellers ved den ikke noget om brugeren fra req.user
export function me(req, res) {
  // req.user bliver sat af requireAuth middleware.
  // Derfor returnerer vi bare de sikre felter herfra.
  return res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role
  });
}
// ___________
// ME
//____________slut



//______________
// allUsers
//_____________start
//returner alle alm brugere
export async function getAllUsers(req, res) {
  try {
    const users = await getUsers();

    // filtrer admins fra
    const noAdmins = users.filter(user => {
      return user.role !== 'admin'
    })

    // isolér usernames så sensitive ting filreres væk
    const usernames = noAdmins.map(u => u.username);

    return res.json(usernames);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}
//______________
// allUsers
//_____________slut