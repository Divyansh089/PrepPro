# 🚀 PrepPro — AI-Powered Interview & Placement Prep Platform

PrepPro is a full-stack, AI-driven placement preparation platform that helps software engineers and students master coding, technical concepts, aptitude, and live mock interviews powered by Google Gemini AI.

---

## 🏗️ Project Architecture

The project is structured into two clean, standalone workspaces:

```
PrepPro/
├── frontend/             # Next.js 15 (App Router) + React 19 + Tailwind CSS v4
│   ├── src/
│   │   ├── app/          # App Router Pages (/dashboard, /interview, /practice, /tests, etc.)
│   │   ├── components/   # UI Primitives & Layout Components
│   │   ├── hooks/        # Custom React Hooks
│   │   └── lib/          # API Client Helpers & Validations
│   ├── public/           # Static Assets
│   └── package.json
└── backend/              # Node.js + Express (MVC Architecture) + MongoDB
    ├── src/
    │   ├── config/       # Database & Environment Setup
    │   ├── controllers/  # Express Request Controllers
    │   ├── middlewares/  # Authentication Middleware (JWT)
    │   ├── models/       # MongoDB Interfaces & Data Models
    │   ├── routes/       # Express Route Definitions
    │   ├── services/     # Gemini AI, Scoring & Code Sandbox Engines
    │   └── server.ts     # Main Server Entrypoint
    └── package.json
```

---

## ⚡ Tech Stack

### **Frontend (`/frontend`)**
- **Framework:** Next.js 15.3.5 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4, Radix UI Primitives, Framer Motion, Lucide Icons, Sonner
- **Code Editor:** `@monaco-editor/react` (Embedded VS Code Monaco Editor)
- **Data Visualization:** Recharts, Cobe (3D Globe Visualization)

### **Backend (`/backend`)**
- **Architecture:** Express.js with Model-View-Controller (MVC) Design
- **Database:** MongoDB Native Driver
- **AI Integration:** `@google/generative-ai` (Google Gemini API)
- **Security:** JSON Web Tokens (JWT), `bcrypt` Password Hashing, CORS

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) or Bun / Yarn / npm
- MongoDB running locally or a MongoDB Atlas Connection String
- Google Gemini API Key

---

### 1️⃣ Setting Up the Backend

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create environment configuration (.env)
# MONGODB_URI=mongodb://localhost:27017/preppro
# GEMINI_API_KEY=your_gemini_api_key
# JWT_SECRET=your_jwt_secret
# PORT=5000
# CORS_ORIGIN=http://localhost:3000

# Start the development server
npm run dev
```

The backend server will run on `http://localhost:5000`.

---

### 2️⃣ Setting Up the Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

---

## 🛠️ Main Features

- 🎙️ **AI Mock Interviews (`/interview`):** Real-time interactive interviews with Gemini AI, customizable by target role, experience level, and company.
- 💻 **Practice Workspaces (`/practice`):** Category-based aptitude and programming questions with Monaco code editor integration.
- 📝 **Structured Assessments (`/tests`):** Timed technical tracks (Cloud, DBMS, OS, Computer Networks, System Design) with auto-evaluation.
- 📊 **Analytics & Radar Insights (`/insights`):** Visual performance radar charts, score progression, and identified weakness areas.
- 🏆 **Live Leaderboard (`/leaderboard`):** Competitive candidate rankings based on total test scores and accuracy.
