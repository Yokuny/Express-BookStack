export const allowedOrigins = [
  "https://vue-book-stack.vercel.app/",
  "https://vue-book-stack-git-dev-felipe-rangel-ribeiros-projects.vercel.app/",
  "https://vue-book-stack-cqd8hn66q-felipe-rangel-ribeiros-projects.vercel.app/",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export const corsOptions = {
  credentials: true,
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`${origin} não listado em CORS`));
  },
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "Cookie"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};
