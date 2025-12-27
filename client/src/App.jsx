import { useState, useRef } from "react";
import axios from "axios";
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  FileAudio,
} from "lucide-react";
import "./App.css";

const BACKEND_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://your-backend-domain.vercel.app"; // fallback for prod

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      setFile(droppedFile);
    } else {
      toast("⚠️ Please upload a valid audio file.");
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type.startsWith("audio/")) setFile(f);
    else toast("⚠️ Please select an audio file.");
  };

  const toast = (msg) => {
    alert(msg); // quick way. you can replace w/ better UI later
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      return toast("Upload a recording first!");
    }

    setLoading(true);
    setResult(null);

    const data = new FormData();
    data.append("audio", file);

    try {
      const res = await axios.post(`${BACKEND_URL}/process-call`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.data?.success) throw new Error("Server response invalid");
      setResult(res.data);
    } catch (err) {
      toast(
        "❌ Error: " +
        (err.response?.data?.error ||
          err.message ||
          "Something went wrong.")
      );
    } finally {
      setLoading(false);
    }
  };

  const isScam =
    result?.analysis?.is_scam === true ||
    String(result?.analysis?.is_scam).toLowerCase() === "true";

  const confidence = Math.round((result?.analysis?.confidence || 0) * 100);

  const cleanReasons = Array.isArray(result?.analysis?.reasons)
    ? result?.analysis?.reasons
    : result?.analysis?.reasons
      ? [result?.analysis?.reasons]
      : [];

  return (
    <div className="container fade-in">
      <header className="app-header">
        <h1 className="app-title">eRaksha</h1>
        <p className="app-subtitle">
          AI-Powered Scam Detection — Stay Safer, Always 🌐
        </p>
      </header>

      <main>
        <div className="upload-section">
          <form onSubmit={handleSubmit}>
            <div
              className={`glass-card drop-zone ${dragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <div className="upload-content">
                <Upload className={`upload-icon ${dragging ? "pulse" : ""}`} />
                <h3>{file ? "Ready to Analyze" : "Drop your call recording"}</h3>
                <p>{file ? file.name : "or click to browse"}</p>
                {file && <span className="file-name">{file.name}</span>}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <div className="loader"></div> Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Recording <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {result && (
          <div className="results-grid fade-in">
            <div className={`glass-card verdict-card ${isScam ? "scam" : "safe"}`}>
              <div className="verdict-header">
                {isScam ? (
                  <ShieldAlert
                    size={48}
                    className="scam-icon"
                    style={{ color: "var(--scam)" }}
                  />
                ) : (
                  <ShieldCheck
                    size={48}
                    className="safe-icon"
                    style={{ color: "var(--safe)" }}
                  />
                )}

                <div>
                  <h2 className={`verdict-title ${isScam ? "scam" : "safe"}`}>
                    {isScam ? "⚠️ Scam Likely" : "🟢 Safe Call"}
                  </h2>
                  <span
                    className={`confidence-badge ${isScam ? "badge-scam" : "badge-safe"
                      }`}
                  >
                    {confidence}% Confidence
                  </span>
                </div>
              </div>

              <div className="details-section">
                <div
                  className="info-box glass-card"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <h3 className="box-title">
                    <AlertCircle size={16} /> Indicators
                  </h3>
                  <ul className="reason-list">
                    {cleanReasons.map((r, i) => (
                      <li key={i} className="reason-item">
                        <span className="reason-bullet"></span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="info-box glass-card"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <h3 className="box-title">
                    <MessageSquare size={16} /> Safety Advice
                  </h3>
                  <p className="safe-reply">
                    {result?.analysis?.safe_reply || "No advice available."}
                  </p>
                </div>

                <div className="info-box glass-card transcript-box">
                  <h3 className="box-title">
                    <FileAudio size={16} /> Call Transcript
                  </h3>
                  <p>{result?.transcript || "Transcript unavailable."}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer
        style={{
          textAlign: "center",
          marginTop: "4rem",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        <p>&copy; 2025 eRaksha — Building safer India 🇮🇳</p>
      </footer>
    </div>
  );
}

export default App;
