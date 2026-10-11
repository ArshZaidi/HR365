HR365 — AI-Powered Human Resource Management Platform
LLM-powered RAG architecture with vector embeddings, FAISS retrieval, confidence scoring, and grounded HR intelligence.
HR365 is an AI-first Human Resource Management System that brings employee self-service and everyday HR workflows behind a conversational interface. It combines a custom Retrieval-Augmented Generation (RAG) pipeline for company knowledge with authenticated database access for employee-specific information—so policy answers and personal HR data follow different, purpose-built paths.
￼ ￼ ￼ ￼ ￼ 

Ask. Understand. Act.

Contents
Why HR365?
Core capabilities
How the AI assistant works
Architecture
Technology stack
Repository layout
Getting started
Environment configuration
API overview
Security design
Evaluation and testing
Current scope
Roadmap
Contributing
Author
Why HR365?
HR tools often make employees jump between policy documents, attendance pages, leave forms, support tickets, and company announcements. HR365 aims to make those interactions simpler: employees can ask a question in natural language, retrieve information they are authorized to see, and use supported workflows without having to know which screen or endpoint to open.
Example prompts:
“What is the remote-work policy?”
“What is my attendance summary?”
“Show me the status of my leave requests.”
“Can I work remotely while I am on probation?”
“Help me raise an HR request about payroll.”
“Apply for leave from October 7 to October 9.”
The assistant routes each request to the relevant source or workflow instead of treating every prompt as a generic LLM question.
Core capabilities
AI workplace assistant
Natural-language HR question answering.
Query routing for policy, personal-data, hybrid, action, and out-of-scope requests.
Answers grounded in retrieved company knowledge or authenticated employee data.
Confidence-aware handling for questions with insufficient evidence.
Escalation paths for HR questions that need human attention.
Confirmation-oriented flows for supported state-changing actions.
Custom RAG pipeline
Document ingestion and text processing.
Sentence-transformer-based semantic embeddings.
FAISS vector similarity retrieval.
Lexical reranking to improve candidate relevance.
Confidence scoring based on retrieved evidence.
LLM response generation through Groq.
Evidence-grounded responses and out-of-knowledge-base handling.
Employee self-service
Attendance records and summaries.
Leave requests, history, and status.
HR support requests and escalation tracking.
Employee-specific information retrieved through authenticated backend access.
HR workflows and communications
Leave application preview and confirmation flows.
HR request creation, tracking, and escalation.
Company notices with read/unread tracking.
Role-aware HR and administrative operations.
Task reassignment support based on relevant employee and workload context.
Important: Available features depend on the current configuration, database schema, credentials, and deployed version. This repository is a software project/demo, not a certified or production-ready HRIS replacement.
How the AI assistant works
HR365 separates company-wide knowledge from private employee information.
Request type
Processing path
Source of truth
Company policy
Retrieve → rerank → score evidence → generate answer
HR knowledge base
Personal HR data
Authenticate → authorize → query
Supabase/PostgreSQL
Policy + employee context
Retrieve authorized context and policy evidence
Database + knowledge base
Supported HR action
Classify intent → validate details → preview/confirm → execute
HR workflow API
Unsupported or uncertain question
Detect insufficient scope/evidence → respond safely or escalate
Confidence and escalation logic
RAG flow
Question
   │
   ▼
Query classification
   │
   ├── Personal data ──► Authenticated database query
   │
   ├── HR action ──────► Validated workflow
   │
   └── Policy question
            │
            ▼
       Text embeddings
            │
            ▼
        FAISS search
            │
            ▼
       Lexical reranking
            │
            ▼
       Confidence scoring
            │
            ▼
      Groq LLM inference
            │
            ▼
   Grounded answer / escalation
Confidence-aware answers
The retrieval pipeline evaluates evidence quality before generating or accepting an answer. Confidence is categorized as high, medium, or low; low-confidence results can be handled through an escalation path rather than presenting an unsupported answer as fact.
Why not put all HR data into the vector index?
Company policies and personal employee records have different access and freshness requirements. HR365 is designed to use RAG for shared organizational knowledge and authenticated database queries for employee-specific information. This helps avoid treating private, changing records as static knowledge-base documents.
Architecture
┌──────────────────────────┐
│       Next.js UI         │
│ Assistant · Dashboard    │
│ Attendance · Leave       │
│ HR requests · Notices    │
└────────────┬─────────────┘
             │ REST + auth
             ▼
┌──────────────────────────┐
│        FastAPI           │
│ Auth · Authorization     │
│ HR APIs · Query routing  │
│ Assistant action layer   │
└───────────┬──────────────┘
            │
      ┌─────┴──────────┐
      ▼                ▼
┌──────────────┐  ┌─────────────────┐
│ AI / RAG     │  │ Supabase        │
│ Embeddings   │  │ PostgreSQL      │
│ FAISS        │  │ Auth / RLS      │
│ Reranking    │  │ HR records      │
│ Confidence   │  └─────────────────┘
│ Groq         │
└──────────────┘
Technology stack
Layer
Technologies
Frontend
Next.js, React, TypeScript, Tailwind CSS
UI and motion
Framer Motion, GSAP, Lenis, Lucide
Backend
Python, FastAPI, Pydantic, REST
LLM inference
Groq
Embeddings and retrieval
Transformers, FAISS, NumPy
Document processing
pypdf
Database
Supabase, PostgreSQL
Authentication
Supabase Auth, JWT
Data protection
PostgreSQL Row-Level Security, AES-256-GCM for selected sensitive fields
Deployment
Vercel, Render
Repository layout
HR365/
├── backend/
│   ├── app/
│   │   ├── auth/          # Authentication and authorization
│   │   ├── data/          # Data access and knowledge sources
│   │   ├── engines/       # Query and answer-processing engines
│   │   ├── models/        # Pydantic/data models
│   │   ├── rag/           # Retrieval-augmented generation
│   │   ├── routers/       # API routes
│   │   ├── services/      # Application services
│   │   ├── config.py      # Configuration
│   │   └── main.py        # FastAPI entry point
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── index/
│   ├── scripts/
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── README.md
Getting started
Prerequisites
Python 3.10+ (use a version compatible with the installed dependencies)
Node.js and npm
A Supabase project
A Groq API key for LLM-powered responses
1. Clone the repository
git clone https://github.com/ArshZaidi/HR365.git
cd HR365
2. Configure the backend
cd backend
python -m venv .venv
Activate the virtual environment.
Windows (PowerShell):
.venv\Scripts\Activate.ps1
macOS / Linux:
source .venv/bin/activate
Install dependencies:
python -m pip install --upgrade pip
pip install -r requirements.txt
3. Configure environment variables
Create a local backend/.env file. Do not commit it.
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
HR365_ENCRYPTION_KEY=your_base64_encoded_32_byte_key
CORS_ORIGINS=http://localhost:3000
ENABLE_AUTH_TEST_ROUTES=false
Use the variable names expected by the current backend configuration. The encryption key must meet the format and length expected by the encryption implementation. Keep production secrets out of source control, logs, screenshots, and client-side environment variables.
4. Start the API
From the backend/ directory:
uvicorn app.main:app --reload
By default, the API should be available at:
API: http://localhost:8000
Interactive API documentation: http://localhost:8000/docs
5. Start the frontend
Open a second terminal from the repository root:
cd frontend
npm install
npm run dev
Open http://localhost:3000.
6. Verify the local setup
Confirm the backend starts without configuration errors.
Open /docs and check that the expected routes are registered.
Confirm the frontend can reach the configured backend URL.
Test authentication and authorization with non-production accounts.
Test policy questions against the configured knowledge base and verify that unsupported questions do not produce fabricated policy claims.
Database schema, Supabase policies, and environment variables must be configured for the features you intend to run. A successful local server start does not, by itself, mean every integration is configured.
Environment configuration
Variable
Purpose
SUPABASE_URL
Supabase project URL
SUPABASE_KEY
Supabase key used by the backend; configure it according to the project's auth/RLS design
GROQ_API_KEY
API key for Groq inference
HR365_ENCRYPTION_KEY
Key used by the selected AES-256-GCM encryption implementation
CORS_ORIGINS
Allowed frontend origins
ENABLE_AUTH_TEST_ROUTES
Controls development authentication test routes; keep disabled outside local development
Check the backend configuration and deployment environment for any additional variables required by your checkout.
API overview
The backend exposes REST endpoints for authentication, the AI assistant, attendance, leave management, HR requests, and notices. The routes below summarize the interface documented by the project; consult the running API docs for the definitive request and response schemas.
Area
Method and route
Purpose
Authentication
GET /api/auth/me
Get the authenticated profile
AI assistant
POST /api/ask
Process an HR question
Attendance
GET /api/attendance/me
Get the current employee's attendance
Attendance
GET /api/attendance/me/summary
Get an attendance summary
Leaves
GET /api/leaves/me
List the current employee's leaves
Leaves
POST /api/leaves
Submit a leave request
AI leave flow
POST /api/leaves/ai/preview
Preview an AI-assisted leave request
AI leave flow
POST /api/leaves/ai/confirm
Confirm a leave request
HR requests
GET /api/hr-requests
List accessible HR requests
HR requests
POST /api/hr-requests
Create an HR request
HR requests
POST /api/hr-requests/{id}/escalate
Escalate a request
Notices
GET /api/notices
Retrieve accessible notices
Notices
POST /api/notices
Publish a notice, subject to authorization
Notices
POST /api/notices/{id}/read
Mark a notice as read
Interactive documentation: http://localhost:8000/docs
Security design
HR365 handles sensitive employee information, so authorization is as important as answer quality.
Authentication: Supabase Auth and JWT-backed requests.
Role-aware access: Employee, HR, and admin capabilities are separated by authorization checks.
Database access: PostgreSQL Row-Level Security is part of the intended data-isolation model.
Sensitive fields: AES-256-GCM is used for selected HR request content.
API hygiene: Input validation, CORS configuration, environment-based secrets, and controlled error responses.
AES-256-GCM here is application/data-layer encryption, not end-to-end encryption: the backend needs access to the key to process protected data. Security depends on the actual deployment configuration, correct RLS policies, key management, and authorization checks. Review these before using real employee data. Never expose service-role keys or encryption keys in the frontend.
Evaluation and testing
The RAG pipeline should be evaluated on retrieval quality as well as answer quality. Useful checks include:
Whether the correct policy appears in the top-k retrieved documents.
Whether reranking improves the position of relevant evidence.
Whether confidence scoring flags weak or missing evidence.
Whether answers stay grounded in retrieved passages.
Whether personal-data requests use authenticated data access rather than the policy index.
Whether authorization prevents one employee from reading another employee's records.
Whether state-changing actions validate inputs and require confirmation where appropriate.
Run the current implementation's available checks and use the live API documentation to verify routes. Do not treat retrieval metrics alone as proof of answer correctness, privacy, or production readiness.
Current scope
HR365 was developed as a full-stack AI/HR platform project for the Microsoft Innovate Hackathon 2026. It combines a local application architecture with AI-assisted HR flows. Some capabilities depend on external credentials, database setup, policy documents, and deployment configuration.
The repository should be treated as a development project rather than a certified HR, payroll, or compliance product. Use synthetic data for evaluation until the security model and operational requirements have been independently reviewed.
Roadmap
Potential areas for future work:
Automated retrieval and answer-quality evaluation.
Better observability for retrieval, confidence, latency, and escalation.
Policy ingestion and knowledge-base versioning workflows.
Broader HR workflow automation and integrations.
Improved multilingual policy support.
Expanded reporting and workforce analytics.
Deployment hardening and end-to-end integration tests.
Contributing
Contributions and constructive feedback are welcome.
Fork the repository.
Create a focused branch: git checkout -b feat/your-change.
Make and test your changes.
Keep secrets and real employee data out of commits and test fixtures.
Open a pull request describing the problem, solution, and validation performed.
For substantial changes, open an issue first to discuss the approach.
Author
Arsh Zaidi
GitHub: @ArshZaidi
LinkedIn: arsh-raza-zaidi
LeetCode: Arsh_Zaidi
HR365
Your HR system. One intelligent interface.
Ask. Understand. Act. 
