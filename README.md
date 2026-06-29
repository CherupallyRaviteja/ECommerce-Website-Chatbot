# 🛒 E-Commerce Website Chatbot

<div align="center">

![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791.svg)

*An intelligent AI chatbot for e-commerce websites that routes queries across products, policies, uploaded PDFs, cart, and orders — all grounded in context-only responses*

[Features](#-key-features) • [Architecture](#-system-architecture) • [Installation](#-installation) • [API](#-api-reference) • [Usage](#-usage)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Disclaimer](#-disclaimer)

---

## 🎯 Overview

The **E-Commerce Website Chatbot** is a full-stack AI assistant built for online stores. It uses a **planner-router architecture** where a language model first decides *where* an answer should come from, then fetches and generates a grounded, context-only response using **Google Gemini 2.5 Flash**.

- **🧠 Smart Query Routing** via Llama 3.3 70B (Groq)
- **📦 Product Catalogue Search** with filter-based JSON lookups
- **📄 Policy Q&A** across 8 website pages
- **📑 PDF RAG** with hybrid vector + keyword retrieval
- **🛒 Cart & Order Awareness** handled client-side
- **🔒 Strict Grounding** — no pretrained knowledge leakage

### 🎓 Educational Purpose

This project demonstrates production-grade AI techniques applied to e-commerce:
- Planner-router multi-tool AI architecture
- RAG with hybrid semantic + full-text search
- Strict context grounding with post-generation validation
- FastAPI + pgvector backend integration

---

## ✨ Key Features

### 🔥 Core Capabilities

- **Intelligent Query Router**
  - 🔍 **Products Tool**: Filter by category, type, brand, price, and stock
  - 🌐 **Website Tool**: Policy pages — shipping, returns, payments, privacy, FAQ, and more
  - 📑 **PDF RAG Tool**: Upload any PDF and ask questions about it
  - 🛒 **Cart / Order Tool**: Routes to frontend for client-side handling

- **Advanced RAG Pipeline**
  - Hybrid retrieval: cosine vector similarity (60%) + BM25 full-text (40%)
  - Watson-style structure-aware PDF chunking
  - Post-generation similarity validation to block hallucinations
  - Per-PDF metadata tracking in PostgreSQL

- **Strict Answer Grounding**
  - Gemini 2.5 Flash is forbidden from using pretrained knowledge
  - Answers are semantically validated against retrieved context
  - Falls back to `"I don't know."` when confidence is low

- **Production-Ready Backend**
  - FastAPI with CORS support for local and Vercel deployments
  - Neon serverless PostgreSQL with pgvector extension
  - Auto-initializing database schema on first startup

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Frontend (HTML + widget.js)                  │
│              User Input → Chatbot Widget UI                   │
└───────────────────────────┬──────────────────────────────────┘
                            │  POST /chat  or  POST /upload-pdf
┌───────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend (main.py)                  │
│                       controller.py                           │
└───────────────────────────┬──────────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │   PlannerService (Groq)    │
              │   Llama 3.3 70B Router     │
              └──┬──────┬──────┬──────┬───┘
                 │      │      │      │
        ┌────────▼─┐ ┌──▼───┐ ┌▼────┐ ┌▼──────┐
        │ products │ │ web- │ │ pdf │ │ cart/ │
        │          │ │ site │ │     │ │ order │
        └────────┬─┘ └──┬───┘ └┬────┘ └┬──────┘
                 │      │      │        │
        ┌────────▼─┐ ┌──▼───┐ ┌▼───────┴──────┐
        │Knowledge │ │Know- │ │  RAGService    │
        │ Service  │ │ledge │ │  PostgreSQL    │
        │products  │ │pages │ │  + pgvector    │
        │  .json   │ │.json │ │  + tsvector    │
        └────────┬─┘ └──┬───┘ └┬──────────────┘
                 │      │      │
              ┌──▼──────▼──────▼──┐
              │  generator.py     │
              │  Gemini 2.5 Flash │
              │  (context-only)   │
              └───────────────────┘
```

### 🔄 Data Flow

1. **User Input** → Query sent to `POST /chat`
2. **PlannerService** → Llama 3.3 classifies query → returns `{ tool, filters, page }`
3. **Controller** → Dispatches to the right service based on tool
4. **Generator** → Gemini produces a grounded answer from retrieved context
5. **Response** → Answer + metadata returned to frontend widget

---

## 🛠 Technology Stack

### AI / LLM
| Component | Technology |
|---|---|
| Answer Generation | Google Gemini 2.5 Flash |
| Query Router / Planner | Llama 3.3 70B via Groq |
| Embeddings | `all-MiniLM-L6-v2` (Sentence Transformers) |

### Backend & Data
| Component | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| Vector Store | PostgreSQL + pgvector |
| Full-Text Search | PostgreSQL tsvector + GIN index |
| Database Host | Neon (serverless PostgreSQL) |
| PDF Parsing | PyMuPDF / PyPDF2 |
| NLP / Chunking | NLTK + Watson-style chunker |

### Frontend
| Component | Technology |
|---|---|
| Storefront | HTML + Vanilla JavaScript |
| Chatbot Widget | `widget.js` (custom) |
| Deployment | Vercel |

---

## 📥 Installation

### Prerequisites

- **Python 3.13+**
- **pip** package manager
- **Git**
- A **PostgreSQL** database with `pgvector` extension (e.g., [Neon](https://neon.tech) — free tier works)
- **Poppler** on PATH (Windows: `C:\poppler\Library\bin`) for PDF processing
- API keys for:
  - [Google Gemini](https://aistudio.google.com/)
  - [Groq](https://console.groq.com/)

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd "Ecommerce Website Chatbot"
   ```

2. **Create Virtual Environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**

   Create a `.env` file inside `backend/`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```

5. **Run the Backend**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   On first startup, the database schema (`uploaded_pdfs`, `documents` tables + indexes) is created automatically.

6. **Launch the Frontend**
   ```bash
   # From the project root — serve the Frontend/ folder
   npx serve Frontend
   # or use VS Code Live Server on port 5500
   ```

7. **Access the App**

   Open `http://localhost:5500` in your browser.

---

## ⚙ Configuration

### Environment Variables

```env
# Required
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

> ⚠️ **Never commit `.env` to version control.** Add `backend/.env` to your `.gitignore`.

### Key Model Settings (`config.py`)

| Setting | Value | Description |
|---|---|---|
| `MODEL` | `gemini-2.5-flash` | Gemini model for answer generation |
| `EMBED_MODEL` | `all-MiniLM-L6-v2` | Sentence embedding model |
| `EMBED_DIM` | `384` | Embedding vector dimension |
| `FAISS_TOP_K` | `4` | Top chunks retrieved per query |
| `SIM_THRESHOLD` | `0.3` | Minimum retrieval similarity score |

### API Keys

#### 1. Google Gemini (Required)
**For**: Context-grounded answer generation

1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Create an API key
3. Add to `.env`: `GEMINI_API_KEY=AIza...`

#### 2. Groq (Required)
**For**: Ultra-fast Llama 3.3 70B query routing

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up (free tier available)
3. Add to `.env`: `GROQ_API_KEY=gsk_...`

#### 3. Neon PostgreSQL (Required)
**For**: Vector store and PDF metadata

1. Visit [neon.tech](https://neon.tech) (free tier available)
2. Create a project and enable the `pgvector` extension
3. Add the connection string to `.env`: `DATABASE_URL=postgresql://...`

---

## 🚀 Usage

### Asking Questions

Once the app is running, type any query into the chat widget:

| Query Type | Example |
|---|---|
| Product search | `"Show me Samsung phones under ₹30000"` |
| Policy question | `"What is your return policy?"` |
| PDF question | `"Summarize the uploaded document"` |
| Cart | `"What's in my cart?"` |
| Orders | `"Where is my order?"` |

### Uploading a PDF

Click the upload button in the widget to attach a PDF. Once processed, you can ask natural language questions about its contents. The system chunks, embeds, and stores it automatically.

---

## 📁 Project Structure

```
Ecommerce Website Chatbot/
│
├── backend/
│   ├── main.py                  # FastAPI app — /chat and /upload-pdf routes
│   ├── controller.py            # Query dispatcher — reads plan, calls service
│   ├── config.py                # Models, env vars, embedding loader
│   ├── generator.py             # Gemini answer generation + validation
│   ├── chunking.py              # Watson-style structure-aware PDF chunker
│   ├── document_loader.py       # PDF → chunks → embeddings pipeline
│   ├── db_init.py               # Auto-creates PostgreSQL schema on startup
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # API keys (create this — do not commit)
│   │
│   ├── services/
│   │   ├── planner_service.py   # Groq/Llama router — classifies every query
│   │   ├── knowledge_service.py # JSON product + policy page lookup
│   │   ├── rag_service.py       # PDF ingestion + hybrid retrieval
│   │   └── website_service.py   # Website page fetching utilities
│   │
│   ├── website_data/
│   │   ├── products.json        # Full product catalogue
│   │   └── policies.json        # All website policy pages
│   │
│   └── uploads/                 # Uploaded PDFs stored at runtime
│
└── Frontend/
    ├── index.html               # Main e-commerce storefront
    ├── widget.js                # Chatbot widget — UI + API integration
    └── products.js              # Product listing and display logic
```

---

## 🔧 How It Works

### 1. Query Planning

Every message goes to `PlannerService`, which calls **Llama 3.3 70B** (via Groq) with a structured system prompt. The model returns a JSON routing plan:

```json
{
  "tool": "products",
  "filters": [
    { "field": "brand", "operator": "equals", "value": "Samsung" },
    { "field": "price", "operator": "<=", "value": 30000 }
  ],
  "page": null
}
```

### 2. Routing & Retrieval

`controller.py` reads the plan and dispatches:

- **`products`** → `KnowledgeService.search_products()` — filters `products.json` in memory
- **`website`** → `KnowledgeService.get_page()` — returns the matching policy page
- **`pdf`** → `RAGService.retrieve()` — hybrid cosine + full-text search on PostgreSQL
- **`cart` / `order`** → `{ answer: null, tool: "cart" }` — frontend handles these

### 3. Answer Generation

Retrieved context is passed to `generator.py`, which builds a strict prompt for **Gemini 2.5 Flash**:
- Forbidden from using any pretrained knowledge
- Must answer only from the provided context
- Falls back to `"I don't know."` if context is insufficient

A post-generation cosine similarity check between the answer and context blocks any response that drifts from the source material.

### 4. PDF Ingestion Pipeline

When a PDF is uploaded via `POST /upload-pdf`:

```
PDF File
  │
  ▼
PyMuPDF / PyPDF2  →  Raw text per page
  │
  ▼
Watson Chunker  →  Structure-aware chunks (≤250 words)
  │
  ▼
SentenceTransformer  →  384-dim embeddings
  │
  ▼
PostgreSQL  →  vector column (pgvector) + tsv column (tsvector)
```

Retrieval uses a **60/40 hybrid score**: `0.6 × cosine_similarity + 0.4 × ts_rank`.

---

## 🌐 API Reference

### `GET /`
Health check.

**Response:**
```json
{ "message": "Welcome to the E-Commerce Chatbot API!" }
```

---

### `POST /chat`
Send a user query to the chatbot.

**Request Body:**
```json
{
  "query": "Show me Samsung phones under ₹30000",
  "cart": [],
  "orders": []
}
```

**Responses by tool:**

```json
// products
{ "answer": "Here are Samsung phones under ₹30,000...", "tool": "products", "products": [...] }

// website policy
{ "answer": "Our return window is 7 days...", "tool": "website" }

// PDF RAG
{ "answer": "According to the document...", "tool": "pdf", "sources": { "report.pdf": 3 } }

// cart / order (client-side)
{ "answer": null, "tool": "cart" }
```

---

### `POST /upload-pdf`
Upload and index a PDF for RAG queries.

**Form Data:** `file` (multipart/form-data)

**Response:**
```json
{
  "answer": "report.pdf uploaded successfully. You can now ask questions about this document.",
  "tool": "website"
}
```

---

## 🐛 Troubleshooting

**1. `psycopg2` connection error**
```bash
# Verify your DATABASE_URL is correct in backend/.env
# Ensure pgvector extension is enabled in your Neon project
```

**2. `GEMINI_API_KEY not found`**
```bash
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GEMINI_API_KEY'))"
```

**3. PDF upload fails**
- Ensure Poppler is installed and its `bin/` folder is on your system PATH
- Windows path: `C:\poppler\Library\bin`

**4. CORS errors in browser**
- Add your frontend's origin to `allow_origins` in `main.py`
- Default allowed: `http://127.0.0.1:5500`, `http://localhost:5500`, Vercel domain

**5. Vector store errors / stale index**
```bash
# Connect to your Neon DB and clear the documents table
DELETE FROM documents;
DELETE FROM uploaded_pdfs;
# Re-upload your PDFs
```

---

## 🤝 Contributing

Contributions are welcome! Potential enhancements:

- [ ] Multi-turn conversation memory
- [ ] Order tracking API integration
- [ ] Cart management via backend
- [ ] Support for multilingual queries
- [ ] Add user authentication
- [ ] Streaming responses (SSE)
- [ ] Analytics dashboard for query logs
- [ ] Docker + docker-compose setup

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

Conditions:
- Include original license
- State changes made

---

<div align="center">

### Demonstrating AI-powered e-commerce assistance with grounded, context-only responses
  By Raviteja Cherupally | Tharuni Gunde | Harika Gundagani

</div>
