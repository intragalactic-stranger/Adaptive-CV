# 🎯 Adaptive-CV

> **AI-Powered Resume Builder** — Parse, Edit, Optimize & Generate Professional PDFs

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 🌟 What is Adaptive-CV?

Adaptive-CV is an intelligent resume builder that uses **AI to parse, edit, and optimize resumes** for specific job descriptions. Upload any resume (PDF/LaTeX), get structured data instantly, chat with AI to improve it, and generate beautifully formatted PDFs — all without knowing LaTeX!

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📄 **Smart Upload** | Parse PDF or LaTeX resumes using AI |
| 🤖 **AI Chat Assistant** | Interactive resume improvement suggestions |
| ✏️ **Visual Editor** | Edit without LaTeX knowledge |
| 🎯 **Job Matching** | Tailor resume to job descriptions |
| 📑 **PDF Generation** | Professional LaTeX-powered output |
| 🏢 **Company Branding** | Upload company logo for branded resumes |
| 💾 **Version Control** | Save and manage multiple versions |
| ⚡ **Redis Caching** | Lightning-fast repeat operations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADAPTIVE-CV                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────────────────────────────────────┐     │
│   │   Frontend   │     │                  Backend                      │     │
│   │              │     │                                               │     │
│   │  ┌────────┐  │     │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │     │
│   │  │ React  │  │ API │  │ FastAPI │  │  Redis  │  │   LiteLLM   │  │     │
│   │  │  +     │◄─┼─────┼─►│ Server  │◄─┼─Cache   │  │  (Gemini/   │  │     │
│   │  │ Vite   │  │     │  │         │  │         │  │   OpenAI)   │  │     │
│   │  └────────┘  │     │  └────┬────┘  └─────────┘  └──────┬──────┘  │     │
│   │              │     │       │                           │         │     │
│   │  ┌────────┐  │     │       ▼                           ▼         │     │
│   │  │Tailwind│  │     │  ┌─────────┐              ┌─────────────┐   │     │
│   │  │   +    │  │     │  │PyMuPDF  │              │  AI Engine  │   │     │
│   │  │Shadcn  │  │     │  │(Parser) │              │  - Parse    │   │     │
│   │  └────────┘  │     │  └─────────┘              │  - Improve  │   │     │
│   │              │     │                           │  - Chat     │   │     │
│   └──────────────┘     │       │                   └─────────────┘   │     │
│                        │       ▼                                      │     │
│                        │  ┌─────────────────┐                        │     │
│                        │  │    Tectonic     │                        │     │
│                        │  │  (LaTeX → PDF)  │                        │     │
│                        │  └─────────────────┘                        │     │
│                        │                                              │     │
│                        └──────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              Data Flow
                              ─────────
        ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
        │ Upload  │───►│  Parse  │───►│  Edit/  │───►│Generate │
        │PDF/LaTeX│    │  (AI)   │    │ Improve │    │   PDF   │
        └─────────┘    └─────────┘    └─────────┘    └─────────┘
              │              │              │              │
              ▼              ▼              ▼              ▼
         Raw File      Structured     Optimized      Professional
                         JSON          Resume           PDF
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite** — Fast, modern UI
- **Tailwind CSS** + **Shadcn UI** — Beautiful components
- **Framer Motion** — Smooth animations
- **Lucide Icons** — Clean iconography

### Backend
- **FastAPI** — High-performance async API
- **LiteLLM** — Universal LLM interface (Gemini, OpenAI, 100+ models)
- **PyMuPDF** — PDF text extraction
- **Tectonic** — LaTeX to PDF compilation
- **Redis** — Caching for performance
- **Pydantic** — Data validation

### AI Models
- **Google Gemini 2.5 Pro** (default)
- **OpenAI GPT-4** (supported)
- Any model via LiteLLM

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- [Gemini API Key](https://makersuite.google.com/app/apikey) (free)

### 1️⃣ Clone & Setup Backend

```bash
git clone https://github.com/YOUR_USERNAME/Adaptive-CV.git
cd Adaptive-CV/backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python -m uvicorn main:app --reload --port 8000
```

### 2️⃣ Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install -g pnpm
pnpm install

# Start dev server
pnpm dev
```

### 3️⃣ Open App
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

### 4️⃣ Optional: Enable Redis Cache

```bash
# macOS
brew install redis && brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

---

## 📖 Usage Guide

### Step 1: Configure API Key
Click the ⚙️ settings icon and enter your Gemini API key.

### Step 2: Upload or Create Resume
- **Upload**: Drop a PDF or LaTeX file
- **New**: Start from scratch with AI chat

### Step 3: Edit & Improve
- Use the visual editor (no LaTeX needed!)
- Add a job description for AI optimization
- Chat with AI for suggestions

### Step 4: Add Company Logo (Optional)
Upload your company logo for branded resumes.

### Step 5: Generate & Download
Click "Generate PDF" for professional output.

---

## 📁 Project Structure

```
Adaptive-CV/
├── backend/
│   ├── main.py           # FastAPI routes
│   ├── ai_engine.py      # LLM integration
│   ├── parser.py         # PDF/LaTeX parsing
│   ├── renderer.py       # LaTeX → PDF
│   ├── cache.py          # Redis caching
│   ├── models.py         # Pydantic schemas
│   ├── templates/
│   │   └── resume.tex    # LaTeX template
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ChatInterface.jsx
│   │       ├── ResumeEditor.jsx
│   │       ├── PDFPreview.jsx
│   │       └── FileExplorer.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/parse` | Parse PDF/LaTeX to JSON |
| `POST` | `/generate` | Generate PDF from JSON |
| `POST` | `/improve` | AI-improve resume section |
| `POST` | `/chat` | Chat with AI assistant |
| `POST` | `/upload-logo` | Upload company logo |
| `POST` | `/save-version` | Save resume version |
| `GET` | `/resumes` | List saved resumes |
| `GET` | `/cache/stats` | Redis cache statistics |

---

## ⚡ Performance

With Redis caching enabled:

| Operation | Without Cache | With Cache |
|-----------|---------------|------------|
| Parse Resume | 3-5 sec | **< 100ms** |
| Generate PDF | 2-3 sec | **< 50ms** |
| AI Suggestions | 2-4 sec | 2-4 sec* |

*AI calls are not cached to ensure fresh suggestions

---

## 🔒 Security

- ✅ API keys stored in browser localStorage only
- ✅ No keys transmitted to our servers
- ✅ Filename sanitization prevents path traversal
- ✅ File type validation on uploads
- ✅ CORS configured for security

---

## 🤝 Contributing

```bash
# Fork the repo, then:
git checkout -b feature/amazing-feature
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
# Open a Pull Request
```

---

## 📄 License

MIT License — feel free to use for any purpose.

---

## 👨‍💻 Team

Built with ❤️ for hackathon by **PiCoders**
Owner : Ganeshan Arumuganainar
email : ganeshanarumuganainar@gmail.com
---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) — AI capabilities
- [LiteLLM](https://github.com/BerriAI/litellm) — Universal LLM interface
- [Tectonic](https://tectonic-typesetting.github.io/) — LaTeX engine
- [Shadcn UI](https://ui.shadcn.com/) — Beautiful components
