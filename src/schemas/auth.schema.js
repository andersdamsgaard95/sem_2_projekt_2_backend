import { z } from "zod";

// Schema for brugeroprettelse
export const registerSchema = z.object({ //.object({...}) → validerer felterne individuelt
  username: z
    .string()
    .min(1, "Username skal være mindst 1 tegn")
    .max(30, "Username må max være 30 tegn"),

  email: z
    .string()
    .email("Ugyldig email")
    .max(254),

  password: z
    .string()
    .min(8, "Password skal være mindst 8 tegn")
    .max(128, "Password må max være 128 tegn")
    .regex(/[a-z]/, "Password skal indeholde mindst ét lille bogstav")
    .regex(/[A-Z]/, "Password skal indeholde mindst ét stort bogstav")
    .regex(/[0-9]/, "Password skal indeholde mindst ét tal")
    .regex(/[^A-Za-z0-9]/, "Password skal indeholde mindst ét specialtegn"),

  confirmPassword: z.string()
})
  .refine((data) => data.password === data.confirmPassword, { //.refine(...) → validerer relationen mellem felter
    message: "Passwords matcher ikke",
    path: ["confirmPassword"], // fejl vises på dette felt
  });

// Schema for login
export const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(128)
});

