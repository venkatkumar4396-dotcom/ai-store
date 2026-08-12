# NexusForge — AI Agent Marketplace & OS Platform

> Discover, configure, and deploy intelligent AI automation agents from a unified control center.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (Next.js 15 App Router)           │
│              Port: 3000                                 │
│              TailwindCSS + Framer Motion + Lucide       │
└────────────────────────────┬────────────────────────────┘
                             │ REST API & WebSocket (Socket.IO)
┌────────────────────────────▼────────────────────────────┐
│              Backend API (Express 5 + TypeScript)       │
│              Port: 5000                                 │
│              Prisma ORM + Socket.IO + Rate Limiters     │
└──────────────┬──────────────┬──────────────┬────────────┘
               │              │              │
        ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────┐
        │ PostgreSQL │ │ WhatsApp   │ │ AI Provider │
        │ / SQLite   │ │ web.js     │ │ Router      │
        └────────────┘ └────────────┘ └──────┬──────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
               Moonshot AI (Kimi)      Google Gemini        Ollama (Local)
```

---

## 🤖 Available AI Agents

| Agent Name | Description | Key Features |
|---|---|---|
| **Stock Intelligence Agent** | Technical market analysis & AI buy/sell recommendations | RSI, MACD, Bollinger Bands, sentiment scoring, paper trading |
| **Booking Hub & Travel Agent** | Multi-modal travel & accommodation booking | Flights, Buses, Trains, Hotels search & instant deal comparisons |
| **Startup Co-Founder Agent** | AI venture advisor & business validation | 4-Quadrant SWOT, pricing models, competitor maps, investor readiness |
| **Research Scientist Agent** | Academic literature review & gap analysis | APA citation generation, methodology design, dataset discovery |
| **Career Accelerator Agent** | Job search assistant & ATS resume optimizer | ATS scoring, resume re-writing, interactive mock interview coach |
| **Business Automator Agent** | CRM lead management & automated workflows | Pipeline tracking, AI follow-up email generator, invoice creation |
| **Sales Agent** | B2B lead generation & email outreach | AI lead enrichment, automated cold outreach, meeting scheduler |
| **WhatsApp AI Assistant** | 24/7 customer support bot | Natural language auto-replies, FAQ integration, broadcast campaigns |
| **File Tracker Agent** | Directory change monitoring & analysis | Automated file activity logging, pattern detection, real-time alerts |
| **Document Agent** | AI document summarization & PDF extraction | Key insights extraction, structured table parsing |
| **Productivity Agent** | Task management & AI schedule optimizer | Priority matrix, smart time blocking, goal progress tracking |

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **Ollama**: For local offline LLM fallback

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/nexusforge.git
cd nexusforge

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in both `backend/` and `frontend/`:
```bash
# Backend configuration
cd backend
cp .env.example .env

# Frontend configuration
cd ../frontend
cp .env.example .env.local
```

### 3. Initialize Database
```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

### 4. Start Development Servers
```bash
# Start Backend (Port 5000)
cd backend
npm run dev

# In a separate terminal, start Frontend (Port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🐳 Docker Deployment (Production)

Deploy the entire stack (PostgreSQL, Redis, AI Service, Backend, and Frontend) with a single command:

```bash
# Copy example environment variables
cp .env.example .env

# Build and launch containers in detached mode
docker-compose up -d --build
```

Access services at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

## 🔒 Security & Git Best Practices

- **Zero Hardcoded Secrets**: All keys, passwords, and tokens are read exclusively from `.env`.
- **Pre-configured `.gitignore`**: SQLite databases (`*.db`), runtime sessions, uploaded files, build artifacts (`.next`, `dist`, `node_modules`), and secrets (`.env*`) are strictly ignored.
- **Rate-Limiting & Sanitization**: Helmet headers, XSS input sanitization, and IP/User rate limiters enabled on all backend routes.
- **AI Response Fallback**: Provider fallback chain (Kimi → Gemini → Pollinations → Ollama → Rule Engine) with 60s request timeouts.

---

## 📜 License

Private & Proprietary. All rights reserved.
