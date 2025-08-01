export const allowedOrigins = ["http://localhost:5173/"];

export const corsOptions = {
  credentials: true,
  origin: allowedOrigins,
  allowedHeaders: ["Authorization", "Cookie", "Content-Type"],
  methods: ["GET", "POST", "PUT", "DELETE"],
};
