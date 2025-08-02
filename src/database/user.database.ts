import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, minlength: 5, maxlength: 50, required: true, unique: true },
    password: { type: String, minlength: 5, maxlength: 200, required: true },
    refreshToken: { type: String, required: false, default: null },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
