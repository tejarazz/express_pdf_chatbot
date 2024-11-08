import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    fileName: { type: String, required: true, index: true },
    questions: [
      {
        question: { type: String, required: true },
        aiResponse: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.model("Chat", chatSchema);
