import mongoose from "mongoose";

// Define the PDF schema
const pdfSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    }, // Associate with user
    segments: [
      {
        text: { type: String, required: true }, // The chunked text
        embedding: {
          type: [Number],
          required: true,
          validate: (v) => Array.isArray(v) && v.length > 0,
        }, // Embedding vector validation
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a model for the PDF
export const PdfData = mongoose.model("PdfData", pdfSchema);
