const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const Groq = require("groq-sdk");

const app = express();
const PORT = process.env.PORT || 10000;

// ---------- CORS ----------
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://e-raksha-six.vercel.app"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
}));

// Log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---------- MULTER (Disk upload for reliability) ----------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // Increased to 20MB
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("audio/")) {
            return cb(new Error("Only audio files allowed"));
        }
        cb(null, true);
    },
});

// ---------- GROQ ----------
let groq = null;
if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY missing in .env — AI features disabled.");
} else {
    groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
}

async function transcribeAudio(filePath) {
    if (!groq) return "[Transcription unavailable — missing API key]";

    try {
        console.log(`🔊 Transcribing: ${path.basename(filePath)}`);

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3-turbo",
            response_format: "json",
        });

        console.log("✅ Transcription successful");
        return transcription.text;
    } catch (err) {
        console.error("❌ Transcription error:", err.message);
        if (err.response) {
            console.error("DEBUG INFO:", JSON.stringify(err.response.data || err.response));
        }
        return `[Transcription failed: ${err.message}]`;
    }
}

async function analyzeWithAI(transcript) {
    if (!groq) throw new Error("Groq API key not set.");

    console.log("🧠 Running Scam Analysis...");
    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content: `You are an AI scam detection system. Analyze the transcript & return ONLY JSON.

Format:
{
  "is_scam": true | false,
  "confidence": number (0 to 1),
  "reasons": [string],
  "safe_reply": string
}
`
            },
            {
                role: "user",
                content: `Transcript: ${transcript}`
            }
        ],
        response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
}

// ---------- ROUTES ----------
app.post("/process-call", upload.single("audio"), async (req, res) => {
    console.log("🎤 Request received:", req.file ? `${req.file.filename} (${req.file.size} bytes)` : "No file");

    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: "No audio file uploaded",
        });
    }

    try {
        const transcript = await transcribeAudio(req.file.path);
        const analysis = await analyzeWithAI(transcript);

        // Delete temporary file after processing
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });

        res.json({
            success: true,
            transcript,
            analysis,
        });

        console.log("📤 Analysis completed successfully");
    } catch (err) {
        console.error("🔥 Server error:", err);

        // Ensure file is deleted even on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    }
});

app.get("/", (req, res) => {
    res.send("🟢 eRaksha backend running");
});

// ---------- START ----------
app.listen(PORT, () => {
    console.log(`🚀 Server ready on port ${PORT}`);
});
