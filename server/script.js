const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5500",
        "https://e-raksha-frontend.onrender.com",
        process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (Origin: ${req.headers.origin || 'null'})`);
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("audio/")) {
            cb(new Error("Only audio files are allowed"));
        } else {
            cb(null, true);
        }
    },
});

let groq = null;
if (!process.env.GROQ_API_KEY) {
    console.warn("Groq API key missing in .env. Server will start, but AI analysis will fail.");
} else {
    console.log("Groq API key found. Initializing Groq...");
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
}

async function transcribeAudio(filePath) {
    if (!groq) {
        return "[Transcription unavailable — Groq not initialized]";
    }

    console.log(`Step 1: Transcribing ${filePath} with Groq Whisper...`);
    try {
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3-turbo",
            response_format: "json",
        });

        console.log("Step 1: Transcription Complete");
        return transcription.text;
    } catch (err) {
        console.error("Transcription Error:", err);
        return `[Transcription failed: ${err.message}]`;
    }
}

async function analyzeWithAI(transcript) {
    if (!groq) {
        throw new Error("Groq API key is missing. Please add GROQ_API_KEY to your .env file.");
    }
    console.log("Step 2: Calling Groq AI...");

    try {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content: `You are an AI scam detection system. Analyze the call transcript and respond ONLY in valid JSON.
Required JSON format:
{
  "is_scam": true | false,
  "confidence": number (0 to 1),
  "reasons": [string],
  "safe_reply": string
}`
                },
                {
                    role: "user",
                    content: `Transcript: ${transcript}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (err) {
        console.error("AI Error details:", err);
        throw new Error(`AI Analysis failed: ${err.message}`);
    }
}

app.post("/process-call", upload.single("audio"), async (req, res) => {
    console.log("/process-call hit");

    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: "No audio file uploaded",
        });
    }

    try {
        console.log(`File: ${req.file.originalname}`);
        console.log(`Size: ${req.file.size} bytes`);

        console.log("Step 1: Starting Transcription...");
        const transcript = await transcribeAudio(req.file.path);
        console.log("Step 1: Transcription Complete (Mock/Skipped)");

        console.log("Step 2: Starting AI Analysis...");
        const analysis = await analyzeWithAI(transcript);
        console.log("Step 2: AI Analysis Complete");

        fs.unlink(req.file.path, () => { });

        res.json({
            success: true,
            transcript,
            analysis,
        });
        console.log("Step 4: Response sent to client");
    } catch (err) {
        console.error("Process Error:", err);

        if (req.file?.path) {
            fs.unlink(req.file.path, () => { });
        }

        res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
});

app.get("/", (req, res) => {
    res.send("eRaksha backend is running");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
