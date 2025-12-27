# E-Raksha - AI Scam Detection System

An intelligent AI-powered system that analyzes phone calls in real-time to detect potential scams and protect users from fraud.

## 🚀 Features

- **Real-time Audio Analysis**: Upload audio files for instant scam detection
- **AI-Powered Detection**: Uses Groq's Whisper for transcription and GPT for analysis
- **Confidence Scoring**: Provides confidence levels for scam detection
- **Safe Reply Suggestions**: Offers recommended responses for suspicious calls
- **Modern UI**: Built with React and Framer Motion for smooth animations

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Groq API Key (for AI analysis)

## 🛠️ Local Development

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your API keys:
   ```env
   PORT=3000
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional):
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment on Render

This project includes a `render.yaml` file for easy deployment on Render.

### Steps:

1. **Push to GitHub**: Ensure your code is pushed to GitHub
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Set Environment Variables**:
   - In the Render dashboard, add the following environment variables for the backend:
     - `GROQ_API_KEY`: Your Groq API key
     - `FRONTEND_URL`: Your frontend URL (will be provided after deployment)

4. **Deploy**: Click "Apply" and Render will deploy both services

### Important Notes:

- The backend will be deployed at: `https://e-raksha-api.onrender.com`
- The frontend will be deployed at: `https://e-raksha-frontend.onrender.com`
- Free tier services may spin down after inactivity (first request may take 30-60 seconds)

## 📁 Project Structure

```
E-raksha/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                # Express backend
│   ├── script.js          # Main server file
│   ├── uploads/           # Temporary audio storage
│   └── package.json
├── test samples/          # Sample audio files for testing
├── render.yaml            # Render deployment configuration
└── README.md
```

## 🔑 Environment Variables

### Backend (server/.env)
- `PORT`: Server port (default: 10000 for Render)
- `GROQ_API_KEY`: Your Groq API key for AI analysis
- `FRONTEND_URL`: Frontend URL for CORS (optional)

### Frontend (client/.env)
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000)

## 🧪 Testing

Upload test audio files from the `test samples/` directory to verify the system is working correctly.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Viraj

## 🙏 Acknowledgments

- Groq for AI capabilities
- React and Vite for the frontend framework
- Express.js for the backend framework
