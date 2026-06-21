import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
      // Notify others in the room
      socket.to(roomId).emit("user-joined", { userId: socket.id.substring(0, 5) });
    });

    socket.on("send-message", ({ roomId, message }) => {
      // Broadcast message to everyone in the room including sender
      io.to(roomId).emit("new-message", {
        id: Math.random().toString(36).substring(7),
        text: message,
        senderId: socket.id.substring(0, 5), // Anonymous sender ID
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API Route: Fetch Video Context and Translate
  app.post("/api/translate-video", async (req, res) => {
    const { videoUrl, targetLanguage } = req.body;

    if (!videoUrl || !targetLanguage) {
      return res.status(400).json({ error: "Missing videoUrl or targetLanguage" });
    }

    try {
      // 1. In a real scenario, we'd fetch metadata from a video service.
      // For this demo, we'll try to extract what we can from the URL or simple meta tags
      // and then use Gemini to provide an intelligent "transcription summary" and translation.
      
      // We'll perform a simple fetch to see if we can get some meta description
      let pageTitle = "Unknown Video";
      let pageDescription = "No metadata found.";
      
      try {
        const response = await axios.get(videoUrl, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = response.data;
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const descMatch = html.match(/<meta name="description" content="(.*?)"/);
        
        if (titleMatch) pageTitle = titleMatch[1];
        if (descMatch) pageDescription = descMatch[1];
      } catch (e) {
        console.warn("Could not fetch page metadata directly", (e as Error).message);
      }

      // 2. Use Gemini to Translate and Summarize Content
      const prompt = `
        The user wants to translate content related to a video with the following metadata:
        Title: ${pageTitle}
        Description/Context: ${pageDescription}
        URL: ${videoUrl}

        Action:
        1. Provide a professional translation of the title and description into ${targetLanguage}.
        2. Based on the context, provide a short summary of what the video is likely about in ${targetLanguage}.
        3. Identify potential download methods for this URL (e.g., if it's a direct mp4, mention it; if it's YouTube, mention it's a streaming platform).

        Return the response in a structured JSON format with keys: "translatedTitle", "translatedDescription", "summary", "downloadAdvice".
      `;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(geminiResponse.text || "{}");
      res.json(result);

    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate video content." });
    }
  });

  // API Route: Attempt to find direct download link (proxy simulation)
  app.post("/api/scan-download", async (req, res) => {
    const { videoUrl } = req.body;
    
    // This is a simplified "Senior Engineer" scanner. 
    // In production, you'd use specialized libraries.
    // Here we scan for common video extensions or patterns.
    
    const candidates = [
        videoUrl // Often the URL itself is a direct link
    ];

    // If it's a direct file, we return a success
    if (videoUrl.match(/\.(mp4|mkv|mov|avi|webm)$|/i)) {
         res.json({ 
             found: true, 
             links: [
                 { label: "Original Source", url: videoUrl, type: "mp4/direct" }
             ] 
         });
    } else {
         res.json({ 
             found: false, 
             message: "Direct download links not found. Redirecting to analyzer...",
             advice: "Use specialized scraper for this domain."
         });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
