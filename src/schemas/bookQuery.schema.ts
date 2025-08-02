import { z } from "zod";

export const bookQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !Number.isNaN(val) && val > 0, {
      message: "Página deve ser um número inteiro maior que 0",
    }),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => !Number.isNaN(val) && val > 0 && val <= 100, {
      message: "Limite deve ser um número inteiro entre 1 e 100",
    }),
  search: z
    .string()
    .optional()
    .transform((val) => val?.trim() || "")
    .refine((val) => val.length <= 100, {
      message: "Termo de busca deve ter no máximo 100 caracteres",
    }),
});

export type BookQuery = z.infer<typeof bookQuerySchema>;
