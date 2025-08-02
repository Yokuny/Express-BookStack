import { z } from "zod";

export const bookSchema = z.object({
  isbn: z
    .string()
    .trim()
    .min(1, "ISBN é obrigatório")
    .max(20, "ISBN deve ter no máximo 20 caracteres")
    .regex(/^[\d\-X]+$/, "ISBN deve conter apenas números, hífens e X"),
  name: z.string().trim().min(1, "Nome do livro é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  description: z.string().trim().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional().default(""),
  author: z.string().trim().min(1, "Autor é obrigatório").max(100, "Nome do autor deve ter no máximo 100 caracteres"),
  stock: z.number().int("Estoque deve ser um número inteiro").min(0, "Estoque não pode ser negativo").default(0),
});

export const bookUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nome do livro é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  description: z.string().trim().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional().default(""),
  author: z.string().trim().min(1, "Autor é obrigatório").max(100, "Nome do autor deve ter no máximo 100 caracteres"),
  stock: z.number().int("Estoque deve ser um número inteiro").min(0, "Estoque não pode ser negativo").default(0),
});

export const bookParamsSchema = z.object({
  isbn: z.string().trim().min(1, "ISBN é obrigatório").max(20, "ISBN deve ter no máximo 20 caracteres"),
});

export type BookData = z.infer<typeof bookSchema>;
export type BookParamsData = z.infer<typeof bookParamsSchema>;
