import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    isbn: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: false, trim: true, maxlength: 1000 },
    author: { type: String, required: true, trim: true, maxlength: 100 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ isbn: 1, userID: 1 }, { unique: true });

export const Book = mongoose.model("Book", bookSchema);
