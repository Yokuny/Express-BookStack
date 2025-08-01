import { z } from "zod";
import { emailRegExp, passwordRegExp } from "../helpers/regex.helper";

export const userAcessSchema = z.object({
  email: z.email("Email inválido").trim().min(5, "Email deve ter no mínimo 5 caracteres").max(50, "Email deve ter no máximo 50 caracteres").regex(emailRegExp),
  password: z
    .string()
    .trim()
    .min(5, "Senha deve ter no mínimo 5 caracteres")
    .max(50, "Senha deve ter no máximo 50 caracteres")
    .regex(passwordRegExp, "Senha deve conter letras e números"),
});

export type UserAcess = z.infer<typeof userAcessSchema>;
