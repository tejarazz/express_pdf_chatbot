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

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API);

app.use(cookieParser());

// CORS Middleware should be placed first
app.use(
  cors({
    origin: ["http://localhost:5173", "https://express-documate.netlify.app"],
    credentials: true, // Allow cookies to be sent with the request
  })
);

// Then, set the Access-Control-Allow-Credentials header (if needed explicitly)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User signup
app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Basic email validation (you can enhance this)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Check if user already exists by email
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Password hashing
    const hashPassword = await bcrypt.hash(password, 10); // You can increase salt rounds for stronger hashing

    // Create new user
    const newUser = new Users({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });

    // Save user
    await newUser.save();

    // Send response with user details (excluding password)
    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await Users.findOne({ email });

    // If user not found or password doesn't match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // You can increase the expiration time if needed (e.g., "24h")
    });

    // Set the token in a cookie (secure, httpOnly, sameSite flags are important)
    res.cookie("token", token, {
      httpOnly: true, // Can't be accessed from JavaScript
      secure: process.env.NODE_ENV === "production", // Set to true in production (HTTPS)
      sameSite: "Strict", // Or 'Lax', depending on your needs
      maxAge: 3600000, // Cookie expires in 1 hour
    });

    // Send response with token and userId (excluding password)
    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Authentication Middleware should be placed after CORS
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.token; // Extract token from cookie

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  });
};

// PDF upload
app.post("/upload", authenticateJWT, async (req, res) => {
  const { text, fileName } = req.body;

  if (!text || !fileName) {
    return res.status(400).json({ message: "Text and fileName are required." });
  }

  try {
    const userId = req.user.id; // Ensure the authenticated user ID is attached to the request (assumed from `authenticateJWT`)
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

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
            try {
              const embedding = await embeddings(sentence);
              return { sentence, embedding };
            } catch (embeddingError) {
              console.error("Error embedding sentence:", embeddingError);
              return null; // or some other fallback behavior
            }
          })
        );

        return embeddedSentences.filter(Boolean); // Remove any null values
      })
    );

    // Flatten and structure segments
    const allSegments = segments.flat().map((s) => ({
      text: s.sentence,
      embedding: s.embedding,
    }));

    // Check if the fileName already exists in the database
    const existingPdf = await PdfData.findOne({ fileName, userId });

    if (existingPdf) {
      // If the file already exists for the user, update its segments
      existingPdf.segments = allSegments;
      await existingPdf.save();
      res.status(200).json({
        message: "PDF text updated and vectorized successfully!",
      });
    } else {
      // If it's a new file, create a new PDF entry with the user's ID
      const newPdf = new PdfData({
        fileName,
        userId, // Associate with the user
        segments: allSegments,
      });
      await newPdf.save();
      res.status(201).json({
        message: "PDF text uploaded and vectorized successfully!",
      });
    }
  } catch (error) {
    console.error("Error uploading PDF text:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logout successful" });
});

// Ask a question
app.post("/ask_question", authenticateJWT, async (req, res) => {
  const { question, chatId } = req.body;

  // Check if question and chatId are provided
  if (!question || !chatId) {
    return res
      .status(400)
      .json({ message: "Question and chat ID are required" });
  }

  try {
    // Find the chat by chatId
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat does not exist. Create a new chat first." });
    }

    // Retrieve the PDF data using the fileName from the chat (without userId)
    const pdf = await PdfData.findOne({ fileName: chat.fileName });
    if (!pdf || !pdf.segments || pdf.segments.length === 0) {
      return res
        .status(404)
        .json({ message: "No PDF document or valid segments found." });
    }

    // Generate the question embedding
    const questionVector = await embeddings(question);

    // Filter segments based on cosine similarity
    const similarityThreshold = 0.3;
    const relevantSegments = pdf.segments.filter((segment) => {
      const similarity = cosineSimilarity(questionVector, segment.embedding);
      // Removed the console.log for similarity and segment text
      return similarity >= similarityThreshold;
    });

    // Check if relevant segments were found
    if (!relevantSegments.length) {
      return res
        .status(404)
        .json({ message: "No relevant information found." });
    }

    // Construct prompt for AI model
    const prompt = `Using the following segments, answer the question:\n\n${relevantSegments
      .map((seg) => seg.text)
      .join("\n")}\n\nQuestion: ${question}`;

    // Generate response from the AI model
    const result = await genAI
      .getGenerativeModel({ model: "gemini-1.5-flash" })
      .generateContent(prompt);

    // Add the question and AI response to chat history
    chat.questions.push({
      question,
      aiResponse: result.response.text(),
      timestamp: new Date(),
    });

    // Save the updated chat
    await chat.save();

    // Send the AI response back to the frontend
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

// Get all PDFs for the authenticated user
app.get("/pdfs", authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch only PDFs that belong to the authenticated user
    const pdfs = await PdfData.find({ userId });

    res.json(pdfs);
  } catch (error) {
    console.error("Error fetching PDF data:", error);
    res.status(500).json({ message: "Error fetching PDF data", error });
  }
});

//Delete a chat
app.delete("/chats/:chatId", authenticateJWT, async (req, res) => {
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
app.get("/chat_history/:chatId", authenticateJWT, async (req, res) => {
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

// Fetch chats by userId (extracted from JWT)
app.get("/chats", authenticateJWT, async (req, res) => {
  const userId = req.user?.id; // Extract userId from the JWT

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    const chats = await Chat.find({ userId });

    // Return an empty array if no chats are found
    res.status(200).json(chats || []);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Create new chat
app.post("/create_chat", authenticateJWT, async (req, res) => {
  const { chatId, fileName } = req.body;

  // Ensure that chatId and fileName are provided
  if (!chatId || !fileName) {
    console.log("Missing required fields:", { chatId, fileName });
    return res
      .status(400)
      .json({ message: "Chat ID and file name are required." });
  }

  const userId = req.user?.id;

  if (!userId) {
    console.log("User not authenticated.");
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    // Create a new chat with the retrieved userId
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

// Route to get user data (using userId from JWT)
app.get("/user", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.id; // Extract userId from the decoded JWT

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//Delete a pdf
app.delete("/pdfs/:id", authenticateJWT, async (req, res) => {
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
