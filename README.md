# HR365

### AI-Powered Human Resource Management Platform

> **A secure, intelligent HR platform that combines an AI workplace assistant, policy-aware RAG, employee self-service, HR workflows, task management, and company notices — all in one system.**

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/FAISS-RAG-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sentence_Transformers-Embeddings-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Groq-LLM-orange?style=for-the-badge" />
</p>

<p align="center">
  <strong>Ask. Understand. Act.</strong>
</p>

---

## ✨ Overview

**HR365** is an AI-first Human Resource Management System designed to make everyday HR operations faster, more accessible, and more intelligent.

Instead of forcing employees to navigate multiple HR screens, policies, and workflows, HR365 provides an **AI workplace assistant** capable of understanding natural-language requests and connecting them to the underlying HR system.

Employees can ask questions such as:

```text
"What is my attendance percentage?"

"How many days have I been absent?"

"What is the remote work policy?"

"Show me my leave requests."

"Apply leave from October 7 to October 9."

"Create an HR request regarding payroll."
```

HR365 determines what the employee is asking, retrieves the appropriate company policy or authenticated employee data, and responds using the correct source.

For supported operations, the assistant can also act as a **natural-language command layer over the HRMS**, allowing employees to interact with workflows conversationally.

---

# 🚀 Why HR365?

Traditional HR systems often separate:

* HR policies
* Employee information
* Attendance
* Leave management
* HR support
* Company announcements
* Tasks
* Notifications

HR365 brings these capabilities together around a single intelligent interface.

### The core idea

```text
                 ┌──────────────────────┐
                 │      Employee        │
                 └──────────┬───────────┘
                            │
                     Natural Language
                            │
                            ▼
                 ┌──────────────────────┐
                 │   AI HR Assistant    │
                 └──────────┬───────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
          Company Knowledge      Employee Data
               RAG                 Supabase
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ HR365 Action Layer   │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       Leave             Requests          Tasks
     Management         & Tickets       & Workflows
```

---

# 🎯 Features

## 🤖 AI HR Assistant

A conversational interface for interacting with HR365 using natural language.

The assistant can:

* Answer HR policy questions
* Retrieve authenticated employee information
* Explain attendance records
* Retrieve leave information
* Retrieve HR request information
* Combine employee-specific information with company policies
* Detect unsupported questions
* Escalate low-confidence HR questions
* Trigger supported HR workflows

---

## 🧠 Retrieval-Augmented Generation

HR365 uses a custom **Retrieval-Augmented Generation (RAG)** pipeline to ground policy-related answers in the organization's knowledge base.

### Pipeline

```text
User Question
      │
      ▼
Query Classification
      │
      ├──────────────► Personal Data
      │                    │
      │                    ▼
      │                Supabase
      │
      └──────────────► Company Policy
                           │
                           ▼
                       Retriever
                           │
                           ▼
                       FAISS
                           │
                           ▼
                  Semantic Retrieval
                           │
                           ▼
                    Lexical Reranking
                           │
                           ▼
                  Confidence Engine
                           │
                           ▼
                         LLM
                           │
                           ▼
                    Grounded Answer
```

### Retrieval Stack

* **Sentence Transformers** — semantic embeddings
* **FAISS** — vector similarity search
* **Custom lexical reranker** — contextual relevance
* **Confidence Engine** — evidence quality assessment
* **Groq** — LLM inference
* **Custom RAG pipeline** — no LangChain dependency

---

# 📚 Knowledge Base

HR365 uses a curated company knowledge base covering:

| Document                     | Purpose                           |
| ---------------------------- | --------------------------------- |
| Employee Handbook            | General employee guidelines       |
| Attendance Policy            | Attendance and working-hour rules |
| Leave Policy                 | Leave rules and procedures        |
| Remote Work Policy           | Work-from-home guidelines         |
| Code of Conduct              | Workplace conduct                 |
| Benefits Policy              | Employee benefits                 |
| Payroll Policy               | Payroll-related policies          |
| IT Security Policy           | Security and access guidelines    |
| HR FAQ                       | Frequently asked HR questions     |
| Workplace Safety & Grievance | Safety and grievance procedures   |
| Company Notices              | Company-wide announcements        |

Employee-specific information is **not stored in the RAG knowledge base**.

Instead:

```text
Company-wide information
        ↓
       RAG

Employee-specific information
        ↓
Authenticated Supabase queries
```

This separation improves relevance and data isolation.

---

# 🎯 Intelligent Query Routing

HR365 classifies incoming questions before deciding how they should be handled.

| Route          | Purpose                               |
| -------------- | ------------------------------------- |
| `chitchat`     | Greetings and conversational messages |
| `personal`     | Employee-specific information         |
| `policy`       | Company policies and procedures       |
| `hybrid`       | Employee data + company policy        |
| `action`       | HR workflow operations                |
| `out_of_scope` | Unsupported/non-HR questions          |

### Example

```text
"What is the remote work policy?"
              ↓
           POLICY
              ↓
             RAG
```

```text
"What is my attendance percentage?"
              ↓
          PERSONAL
              ↓
         Supabase
```

```text
"Can I work remotely while I am on probation?"
              ↓
           HYBRID
              ↓
   Employee Context + RAG
```

This prevents every question from being treated as a generic LLM prompt.

---

# 📊 Confidence Engine

HR365 does not blindly trust every retrieved result.

The Confidence Engine evaluates:

* Top semantic similarity
* Mean similarity
* Relevant evidence count
* Evidence quality

### Confidence model

```text
Confidence =
    70% × Top Similarity
  + 20% × Mean Similarity
  + 10% × Evidence Score
```

Responses are classified as:

```text
HIGH
MEDIUM
LOW
```

Low-confidence HR questions can trigger escalation to human HR support.

---

# 🚨 Intelligent HR Escalation

When the system cannot confidently answer an HR question, HR365 can automatically create an HR ticket.

```text
Employee Question
       │
       ▼
     RAG
       │
       ▼
Low Confidence
       │
       ▼
Automatic Escalation
       │
       ▼
   HR Request
       │
       ▼
      HR Team
```

Requests can contain:

* Category
* Priority
* Escalation status
* Escalation reason
* Employee information
* Request metadata

This creates a reliable fallback path from **AI → Human HR support**.

---

# 🧑‍💼 Employee Self-Service

Employees can access their own HR information through authenticated APIs.

### Attendance

* Attendance records
* Present days
* Absent days
* Half-days
* Working hours
* Attendance percentage

### Leave

* Leave requests
* Leave status
* Leave history
* Leave summaries
* Leave applications

### HR Requests

* Create requests
* View requests
* Track status
* View escalations

The AI assistant can expose these capabilities through natural language.

---

# 📝 Natural-Language Leave Management

Employees can initiate leave applications conversationally.

Example:

```text
Employee:
Apply leave from October 7 to October 9.
```

HR365 extracts the required information and generates a confirmation preview before creating the request.

```text
┌─────────────────────────────────────┐
│       Leave Application             │
│                                     │
│  Type: Casual Leave                 │
│  From: 7 October 2026               │
│  To:   9 October 2026               │
│  Days: 3                            │
│                                     │
│  Confirm application?               │
└─────────────────────────────────────┘
```

This reduces accidental submissions while keeping the experience conversational.

---

# 📋 HR Request Management

HR365 provides an HR support workflow with:

### Categories

* Payroll
* Leave
* Attendance
* IT
* General
* Policy
* Other

### Priorities

* Low
* Normal
* High
* Urgent

### Workflow

```text
OPEN
  │
  ▼
ASSIGNED
  │
  ▼
IN PROGRESS
  │
  ▼
RESOLVED
```

Requests can also be escalated manually or automatically.

---

# 🔔 Company Notices

HR365 includes a company-wide notice and notification system.

Employees can receive:

* Company announcements
* Policy updates
* Important alerts
* Payroll notices
* Events
* Urgent communications

Notices support:

* Priority
* Category
* Published date
* Expiry date
* Read/unread state
* Individual read tracking
* HR/Admin management

### Notification flow

```text
HR/Admin
   │
   ▼
Publish Notice
   │
   ▼
Employee Notice Feed
   │
   ├──► Notice Bell
   │
   ├──► Notification Toast
   │
   └──► Read/Unread Tracking
```

---

# 🧩 Task Management & Reassignment

HR365 supports intelligent task reassignment.

When an employee becomes unavailable, the system can consider:

* Employee role
* Department
* Active status
* Approved leave
* Current workload
* Task requirements

The system can identify suitable employees while maintaining an assignment history.

```text
Employee Unavailable
        │
        ▼
Find Eligible Employees
        │
        ├── Role
        ├── Department
        ├── Leave Status
        └── Workload
        │
        ▼
Select Suitable Candidate
        │
        ▼
Reassign Task
        │
        ▼
Record Assignment History
```

---

# 🔐 Security

Security is a core part of HR365 because HR systems handle sensitive employee information.

## Authentication

HR365 uses:

* Supabase Authentication
* JWT-based authentication
* Authenticated API requests

---

## Role-Based Access Control

Three roles are supported:

```text
EMPLOYEE
   │
   ├── Own profile
   ├── Own attendance
   ├── Own leaves
   └── Own HR requests

HR
   │
   ├── Employee support
   ├── HR requests
   ├── Leave management
   ├── Notices
   └── HR workflows

ADMIN
   │
   └── Administrative capabilities
```

---

## Row-Level Security

Supabase PostgreSQL Row-Level Security protects database access.

The backend attaches the authenticated user's JWT to database requests so queries operate under the user's authorization context.

```text
Frontend
   ↓
JWT
   ↓
FastAPI
   ↓
Authenticated Supabase Client
   ↓
PostgreSQL RLS
```

---

# 🔒 AES-256-GCM Encryption

Sensitive HR request content is encrypted using **AES-256-GCM**.

Currently protected fields include:

* HR request subject
* HR request description

AES-256-GCM provides:

* Confidentiality
* Authentication
* Integrity protection
* Tamper detection

> **Note:** HR365 uses application/data-layer encryption. It is not true end-to-end encryption because the backend possesses the encryption key.

---

# 🛡️ API Security

Additional security measures include:

* JWT validation
* Role-based authorization
* PostgreSQL RLS
* CORS restrictions
* Generic API error responses
* Server-side logging
* Environment-based secrets
* Hidden development authentication test routes
* Input validation
* Protected HR endpoints

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js UI      │
                         │                      │
                         │  Dashboard           │
                         │  AI Assistant        │
                         │  Attendance          │
                         │  Leaves              │
                         │  HR Requests         │
                         │  Notices             │
                         │  HR Management       │
                         └──────────┬───────────┘
                                    │
                              REST / JWT
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI         │
                         │                      │
                         │ Authentication       │
                         │ RBAC                 │
                         │ HR APIs              │
                         │ AI Assistant         │
                         │ Action Layer         │
                         └───────┬───────┬──────┘
                                 │       │
                 ┌───────────────┘       └───────────────┐
                 ▼                                       ▼
       ┌────────────────────┐                  ┌────────────────────┐
       │    AI / RAG        │                  │     Supabase       │
       │                    │                  │                    │
       │ SentenceTransform. │                  │ PostgreSQL         │
       │ FAISS              │                  │ Authentication     │
       │ Reranker           │                  │ Row Level Security │
       │ Confidence Engine  │                  │ Storage            │
       │ Groq               │                  └────────────────────┘
       └────────────────────┘
```

---

# 🧰 Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* Framer Motion
* GSAP
* Lenis

### Backend

* Python
* FastAPI
* Pydantic
* REST APIs

### AI / ML

* Groq
* Sentence Transformers
* FAISS
* NumPy
* Custom RAG pipeline
* Custom confidence engine
* Custom lexical reranker

### Database & Authentication

* Supabase
* PostgreSQL
* Supabase Auth
* PostgreSQL Row-Level Security

### Security

* JWT
* AES-256-GCM
* CORS
* Environment-based secrets

### Infrastructure

* Vercel
* Render
* GitHub

---

# 📁 Project Structure

```text
HR365/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── data/
│   │   ├── engines/
│   │   ├── models/
│   │   ├── rag/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── index/
│   │
│   ├── scripts/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── ...
│
├── .env.example
├── README.md
└── .gitignore
```

---

# 🔌 API

### Authentication

```http
GET /api/auth/me
```

Returns the authenticated employee profile.

### AI Assistant

```http
POST /api/ask
```

Processes natural-language HR questions.

Example:

```json
{
  "question": "What is my attendance percentage?"
}
```

### Attendance

```http
GET /api/attendance/me
GET /api/attendance/me/summary
```

### Leaves

```http
GET   /api/leaves/me
POST  /api/leaves
PATCH /api/leaves/{id}
```

AI-assisted leave flow:

```http
POST /api/leaves/ai/preview
POST /api/leaves/ai/confirm
```

### HR Requests

```http
GET   /api/hr-requests
POST  /api/hr-requests
PATCH /api/hr-requests/{id}
POST  /api/hr-requests/{id}/escalate
```

### Notices

```http
GET    /api/notices
POST   /api/notices
DELETE /api/notices/{id}
POST   /api/notices/{id}/read
```

---

# ⚙️ Setup

## 1. Clone

```bash
git clone https://github.com/ArshZaidi/HR365.git
cd HR365
```

## 2. Backend

```bash
cd backend
python -m venv .venv
```

### Windows

```bash
.venv\Scripts\activate
```

### macOS / Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## 3. Environment Variables

Create:

```text
backend/.env
```

Configure:

```env
SUPABASE_URL=
SUPABASE_KEY=
GROQ_API_KEY=
HR365_ENCRYPTION_KEY=
CORS_ORIGINS=http://localhost:3000
ENABLE_AUTH_TEST_ROUTES=false
```

> Never commit `.env` or production secrets to GitHub.

## 4. Start the Backend

From `backend/`:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

## 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 🧪 Testing

HR365 has been tested across multiple system layers.

### Authentication

```text
✓ Valid JWT
✓ Invalid JWT
✓ Expired authentication
✓ Profile lookup
```

### Authorization

```text
✓ Employee access isolation
✓ HR-only endpoints
✓ Admin-only endpoints
✓ Role enforcement
```

### RAG

```text
✓ Semantic retrieval
✓ Top-k retrieval
✓ Lexical reranking
✓ Confidence calculation
✓ Out-of-KB handling
✓ Prompt-injection resistance
```

### Employee Data

```text
✓ Attendance retrieval
✓ Leave retrieval
✓ HR request retrieval
✓ Employee data isolation
```

### HR Workflows

```text
✓ Leave submission
✓ Leave approval/rejection
✓ HR request creation
✓ Manual escalation
✓ Automatic escalation
✓ Notice creation
✓ Notice read tracking
```

---

# 📈 RAG Evaluation

The retrieval system was evaluated against a dedicated set of HR questions.

| Metric   |     Result |
| -------- | ---------: |
| Recall@1 | **93.33%** |
| Recall@3 |   **100%** |
| Recall@5 |   **100%** |

The relevant policy document was retrieved within the top five results for all evaluated questions.

---

# 🧠 Engineering Principles

### 01 — Don't send everything to the LLM

Employee data is retrieved directly from the authenticated database.

### 02 — Ground policy answers

Company policy questions use the internal knowledge base rather than relying on model memory.

### 03 — Measure confidence

The system evaluates retrieval quality before trusting an answer.

### 04 — Escalate uncertainty

Low-confidence HR questions can be routed to human HR support.

### 05 — Confirm actions

State-changing operations can require explicit confirmation.

### 06 — Defense in depth

Authentication, authorization, RLS, encryption, and API controls work together.

---

# 🔄 End-to-End Example

Consider:

> **"Can I work remotely while I'm on probation?"**

HR365 processes this as a hybrid query.

```text
                    User Question
                         │
                         ▼
                 Query Classifier
                         │
                         ▼
                      HYBRID
                    /         \
                   /           \
                  ▼             ▼
        Employee Context       RAG
              │                 │
              │          Remote Work Policy
              │                 │
              └────────┬────────┘
                       ▼
                Confidence Engine
                       │
                       ▼
                     Groq
                       │
                       ▼
               Grounded Response
```

The response can combine authenticated employee context with the relevant company policy.

---

# 🌟 What Makes HR365 Different?

HR365 is not simply:

> **"ChatGPT + an HR database."**

It is designed as an **AI interaction layer over a real HR system**.

```text
                ┌──────────────────────┐
                │     HR365 Assistant   │
                └──────────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    Understand          Retrieve            Act
        │                  │                  │
        ▼                  ▼                  ▼
    Intent/Routing      RAG + DB        HR Workflows
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                    Human Escalation
```

The goal is to make HR interaction feel less like navigating software and more like communicating with an intelligent workplace assistant.

---

# 🗺️ Roadmap

Potential future improvements include:

* Advanced HR analytics
* Payroll integrations
* Calendar integrations
* Email notifications
* More HR workflow automations
* Document upload and policy ingestion UI
* Improved multilingual support
* Advanced employee workload analytics
* Expanded task automation
* Production-grade observability
* Automated RAG evaluation pipelines

---

# 👨‍💻 Developer

## Arsh Zaidi

Computer Science student and developer focused on:

* Artificial Intelligence
* Machine Learning
* Full-Stack Development
* Backend Engineering
* RAG Systems
* Developer Tools

### Connect

* GitHub — [https://github.com/ArshZaidi](https://github.com/ArshZaidi)
* LinkedIn — [https://www.linkedin.com/in/arsh-raza-zaidi-265826311/](https://www.linkedin.com/in/arsh-raza-zaidi-265826311/)
* LeetCode — [https://leetcode.com/u/Arsh_Zaidi/](https://leetcode.com/u/Arsh_Zaidi/)

---

# 🏆 Microsoft Innovate Hackathon 2026

HR365 was built for the **Microsoft Innovate Hackathon 2026** around one central question:

> **What if employees could interact with their entire HR system as naturally as they interact with an AI assistant?**

HR365 is an attempt to build that experience while keeping the underlying HR data, authorization, retrieval, and workflows grounded in a real backend.

---

<p align="center">

## HR365

### Your HR system. One intelligent interface.

**Ask. Understand. Act.**

</p>
