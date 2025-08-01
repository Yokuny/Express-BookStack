import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, minlength: 5, maxlength: 50, required: true, unique: true },
    password: { type: String, minlength: 5, maxlength: 200, required: true },
    refreshToken: { type: String, required: false, default: null },
    role: {
      type: [
        {
          type: String,
          enum: ["admin", "professional", "assistant"],
          default: "professional",
        },
      ],
      required: true,
      minlength: 1,
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
