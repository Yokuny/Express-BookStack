import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.url(),
  PORT: z.string().max(4).min(4),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
