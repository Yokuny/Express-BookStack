import mongoose from "mongoose";
import { env } from "./env.config";

export const dbConnect = async () => {
  const MONGO_URI = env.MONGODB_URI;

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB");
  } catch (err) {
    console.log("❌ Erro ao conectar ao MongoDB:", JSON.stringify(err, null, 2));
  }
};
