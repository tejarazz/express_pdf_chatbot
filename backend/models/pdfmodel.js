import mongoose from "mongoose";

// Define the PDF schema
const pdfSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true, index: true },
    segments: [
      {
        text: { type: String, required: true }, // The chunked text
        embedding: { type: [Number], required: true }, // Embedding vector for the chunk
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a model for the PDF
export const PdfData = mongoose.model("PdfData", pdfSchema);
