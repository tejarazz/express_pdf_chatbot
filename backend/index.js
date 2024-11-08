import express from "express";
import mongoose from "mongoose";
import Users from "./models/usermodel.js";
import bcrypt from "bcrypt";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { PdfData } from "./models/pdfmodel.js";
import embeddings from "@themaximalist/embeddings.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Chat } from "./models/chatmodel.js";
import nlp from "compromise";
import dotenv from "dotenv";

const app = express();
const JWT_SECRET = "krishnateja@2002";
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API);

app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User signup
app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (await Users.exists({ email }))
      return res.status(400).send("User already exists");

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });
    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      _id: newUser._id,
      firstName,
      lastName,
      email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PDF upload
app.post("/upload", async (req, res) => {
  const { text, userId, fileName } = req.body;

  if (!text || !userId || !fileName) {
    return res
      .status(400)
      .json({ message: "Text, userId, and fileName are required." });
  }

  try {
    const chunkSize = 1000; // Adjust as needed
    const chunks = [];

    // Split the text into chunks
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    // Generate embeddings and store segments with embeddings
    const segments = await Promise.all(
      chunks.map(async (chunk) => {
        const sentences = nlp(chunk)
          .sentences()
          .out("array")
          .map((s) => s.trim())
          .filter(Boolean);
        const embeddedSentences = await Promise.all(
          sentences.map(async (sentence) => {
            const embedding = await embeddings(sentence);
            return { sentence, embedding };
          })
        );
        return embeddedSentences;
      })
    );

    // Flatten and structure segments
    const allSegments = segments.flat().map((s) => ({
      text: s.sentence,
      embedding: s.embedding,
    }));

    // Save to database
    const existingPdf =
      (await PdfData.findOneAndUpdate(
        { fileName, userId },
        { segments: allSegments },
        { new: true }
      )) ||
      (await new PdfData({ userId, fileName, segments: allSegments }).save());

    res.status(existingPdf ? 200 : 201).json({
      message: `${
        existingPdf ? "PDF text updated" : "PDF text uploaded"
      } and vectorized successfully!`,
    });
  } catch (error) {
    console.error("Error uploading PDF text:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Logout
app.get("/logout", (req, res) =>
  res.status(200).json({ message: "Logout successful" })
);

// Ask a question
app.post("/ask_question", async (req, res) => {
  const { question, userId, chatId } = req.body;

  if (!question || !userId || !chatId) {
    return res
      .status(400)
      .json({ message: "Question, user ID, and chat ID are required" });
  }

  try {
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat does not exist. Create a new chat first." });
    }

    const pdf = await PdfData.findOne({ userId, fileName: chat.fileName });
    if (!pdf || !pdf.segments || pdf.segments.length === 0) {
      return res
        .status(404)
        .json({ message: "No PDF document or valid segments found." });
    }

    const questionVector = await embeddings(question);
    const similarityThreshold = 0.4;
    const relevantSegments = pdf.segments.filter((segment) => {
      const similarity = cosineSimilarity(questionVector, segment.embedding);
      return similarity >= similarityThreshold;
    });

    if (!relevantSegments.length) {
      return res
        .status(404)
        .json({ message: "No relevant information found." });
    }

    const prompt = `Using the following segments, answer the question:\n\n${relevantSegments
      .map((seg) => seg.text)
      .join("\n")}\n\nQuestion: ${question}`;

    const result = await genAI
      .getGenerativeModel({ model: "gemini-1.5-flash" })
      .generateContent(prompt);

    chat.questions.push({
      question,
      aiResponse: result.response.text(),
      timestamp: new Date(),
    });

    await chat.save();

    res.status(200).json({
      message: "Question processed successfully.",
      question,
      aiResponse: result.response.text(),
    });
  } catch (error) {
    console.log("Error processing request:", error);
    res.status(500).json({ message: "An error occurred." });
  }
});

// Cosine similarity function
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
};

// Get all PDFs
app.get("/api/pdfs", async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId)
    return res.status(401).json({ message: "User not authenticated" });

  try {
    const pdfs = await PdfData.find({ userId });
    res.json(pdfs);
  } catch (error) {
    console.error("Error fetching PDF data:", error);
    res.status(500).json({ message: "Error fetching PDF data", error });
  }
});

//Delete a chat
app.delete("/chats/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ chatId: req.params.chatId });
    if (!chat) return res.status(404).json({ message: "Chat not found." });
    res.status(200).json({ message: "Chat deleted successfully." });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Fetch chat by chatId
app.get("/chat_history/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findOne({ chatId: req.params.chatId });
    if (!chat)
      return res.status(404).json({ message: "Chat history not found." });
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Fetch chats by userId
app.get("/chats/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId });
    if (!chats.length)
      return res.status(404).json({ message: "No chats found for this user." });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/chats", async (req, res) => {
  const { userId, chatId, fileName } = req.body;

  if (!userId || !chatId || !fileName) {
    console.log("Missing required fields:", { userId, chatId, fileName });
    return res
      .status(400)
      .json({ message: "User ID, chat ID, and file name are required." });
  }

  try {
    // Ensure that the correct 'fileName' is used here
    const chat = new Chat({
      userId,
      chatId,
      fileName, // This should be the fileName sent from the frontend
      questions: [],
    });

    await chat.save();
    return res.status(201).json({
      message: "Chat created successfully",
      chatId: chat.chatId,
      fileName: chat.fileName,
    });
  } catch (error) {
    console.error("Error creating new chat:", error);
    return res.status(500).json({ message: "Failed to create chat." });
  }
});

// Route to get user data
app.get("/api/user", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Delete a pdf
app.delete("/api/pdfs/:id", async (req, res) => {
  try {
    const deletedPdf = await PdfData.findByIdAndDelete(req.params.id);
    if (!deletedPdf) return res.status(404).json({ message: "PDF not found" });
    res.status(200).json({ message: "PDF deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete PDF" });
  }
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
