import { z } from "zod";
import { passwordRegExp } from "../helpers/regex.helper";

export const userAcessSchema = z.object({
  name: z.string().trim().min(5, "Nome deve ter no mínimo 5 caracteres").max(50, "Nome deve ter no máximo 50 caracteres"),
  password: z
    .string()
    .trim()
    .min(5, "Senha deve ter no mínimo 5 caracteres")
    .max(50, "Senha deve ter no máximo 50 caracteres")
    .regex(passwordRegExp, "Senha deve conter letras e números"),
});

export type UserAcess = z.infer<typeof userAcessSchema>;
