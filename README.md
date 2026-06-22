# StatementSense 🧾

> **AI-Powered Billing Statement QA & Compliance Platform**

StatementSense is a full-stack web application built for financial services QA teams. It uses AI to compare billing statements, detect compliance violations, auto-generate test cases, track defects with root cause analysis, and export structured QA reports — all in one platform, deployed on AWS.

Built to mirror the real-world workflow of billing statement testing teams at companies like Synchrony Financial — covering overlays, inserts, messaging, marketing offers, and compliance clause validation.

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| Frontend (CloudFront) | `https://d3cn3tr2o5mx6e.cloudfront.ne` |
| Frontend (S3) | `http://statementsense-frontend.s3-website-us-east-1.amazonaws.com/` |(If cloudfront didnt work)
| Backend API (EC2) | `http://3.84.212.66:8000` |
| Swagger API Docs | `http://3.84.212.66:8000/docs` |

The backend API is currently hosted on an EC2 instance over HTTP. When I initially deployed the frontend through CloudFront using HTTPS, the browser blocked API requests due to mixed-content restrictions (HTTPS frontend calling an HTTP backend). Since this is a demo/student project, I temporarily hosted the frontend using the S3 Static Website endpoint, which serves over HTTP, allowing successful communication with the backend. For a production deployment, I would secure the backend using SSL/TLS (Nginx + Let's Encrypt or AWS Certificate Manager) and then serve both frontend and backend over HTTPS.

## Production Security & Deployment Plan

Current Deployment:
- Frontend hosted using Amazon S3 Static Website Hosting.
- Backend hosted on Amazon EC2 using FastAPI.
- Communication currently uses HTTP for demonstration purposes.

Planned Production Deployment:

### Step 1: Register a Custom Domain
- Purchase or configure a domain (e.g., api.statementsense.com).
- Configure Route 53 DNS records to point the domain to the EC2 instance.

### Step 2: Configure Nginx Reverse Proxy
- Install Nginx on the EC2 server.
- Forward external traffic to the FastAPI application running on port 8000.
- Restrict direct access to backend ports.

### Step 3: Enable SSL/TLS Encryption
- Install Certbot and Let's Encrypt certificates.
- Generate and automatically renew SSL certificates.
- Redirect all HTTP traffic to HTTPS.

### Step 4: Secure Frontend Delivery
- Host frontend through Amazon CloudFront.
- Attach SSL certificates using AWS Certificate Manager (ACM).
- Enable HTTPS-only access.

### Step 5: Strengthen API Security
- Enable CORS restrictions.
- Implement JWT-based authentication.
- Add request validation and rate limiting.
- Configure secure HTTP headers.

### Step 6: Monitoring & Logging
- Configure AWS CloudWatch for application monitoring.
- Track API usage and server health.
- Enable error logging and alerting.

### Final Architecture

User
 ↓ HTTPS
CloudFront + ACM
 ↓ HTTPS
Nginx Reverse Proxy
 ↓
FastAPI Backend (EC2)
 ↓
Application Services

Benefits:
- End-to-end encrypted communication.
- Protection against mixed-content issues.
- Improved performance through CloudFront caching.
- Production-grade security and scalability.

---

## 🧠 What It Does

| Feature | Description |
|---|---|
| **Statement Comparison** | Upload old + new billing PDFs; AI detects APR changes, missing clauses, marketing offer diffs |
| **Compliance Scoring** | Every comparison gets a score (0–100) and risk level: Low / Medium / High / Critical |
| **AI Test Case Generation** | Auto-generates 8 structured test cases per comparison across 4 defect categories |
| **Test Cycle Management** | Create QA cycles with SLA deadlines; bulk-add and execute test cases |
| **Defect Tracking** | Log defects; Groq AI generates root cause analysis on every defect automatically |
| **Mainframe Terminal** | IBM 3270-style green screen with live commands and real backend data |
| **SQL Validator** | Run live SELECT queries against the DB from the UI; non-SELECT queries blocked |
| **Excel Report Export** | 3-sheet formatted `.xlsx` report: Executive Summary, Test Cases, Defect Log |
| **Dashboard** | Real-time stats: pass rate, SLA adherence %, open defects, comparisons run |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     USER BROWSER                     │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────────────┐
│              AWS CloudFront (CDN)                    │
│         Global edge delivery + HTTPS termination     │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│               AWS S3 (Frontend)                      │
│    React 19 + Vite static build (dist/)              │
│    Static website hosting — index.html               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              AWS EC2 (Backend)                       │
│         Ubuntu 22.04 LTS — t2.micro                 │
│    ┌─────────────────────────────────────────┐      │
│    │         Docker Container                │      │
│    │   FastAPI + Uvicorn — Port 8000         │      │
│    │   Groq AI · PyMuPDF · OpenPyXL         │      │
│    └─────────────────────────────────────────┘      │
└─────────────────┬───────────────────────────────────┘
                  │ PostgreSQL — port 5432
┌─────────────────▼───────────────────────────────────┐
│              AWS RDS (Database)                      │
│    PostgreSQL 18 — db.t4g.micro (Free Tier)         │
│    Managed backups · Multi-AZ ready                  │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | Latest | Build tool & dev server |
| Tailwind CSS | v3 | Utility-first styling |
| Framer Motion | Latest | Animations & transitions |
| Recharts | Latest | Dashboard charts |
| Lucide React | Latest | Icon library |
| Axios | Latest | HTTP client for API calls |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework — 16 endpoints |
| Uvicorn | ASGI server |
| SQLAlchemy | ORM — 4 database models |
| PostgreSQL | Relational database |
| Groq API (LLaMA 3.1-8b) | AI for compliance analysis, test case generation, RCA |
| PyMuPDF (fitz) | PDF text extraction |
| OpenPyXL | 3-sheet Excel report generation |
| PyTest | 22 API test scripts across all endpoints |
| Psycopg2 | PostgreSQL driver |
| Python Dotenv | Environment variable management |

### Infrastructure (AWS)
| Service | Config | Role |
|---|---|---|
| EC2 | t2.micro · Ubuntu 22.04 | Backend server — runs Docker container |
| RDS | db.t4g.micro · PostgreSQL 18 | Managed database with automated backups |
| S3 | Static website hosting enabled | Frontend build hosting |
| CloudFront | HTTPS · Global edge | CDN — worldwide delivery + SSL termination |
| Docker | Latest | Container runtime on EC2 |
| Security Groups | Ports 22, 80, 443, 8000, 5432 | Network-level firewall |

---

## 🗄️ Database Models

```
TestCycle
├── id, name, description, status
├── sla_deadline (DateTime)
├── total_cases, passed, failed, blocked
├── pass_percentage (Float — auto-computed)
└── created_at, updated_at

TestCase
├── id, cycle_id (FK → TestCycle)
├── title, description, expected_result, actual_result
├── status (Not Executed / Pass / Fail / Blocked)
├── priority (High / Medium / Low)
└── category (Compliance / Marketing / Format / Data)

Defect
├── id, cycle_id (FK → TestCycle)
├── title, description, severity, status
├── root_cause (manual)
├── ai_root_cause (Groq AI generated)
└── resolution, created_at

StatementComparison
├── id, old_filename, new_filename
├── compliance_score (Float 0–100)
├── risk_level (Low / Medium / High / Critical)
├── changes_detected (JSON array)
├── missing_clauses (JSON array)
├── generated_test_cases (JSON array)
└── ai_summary, created_at
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/` | API root — version info |
| POST | `/api/compare` | Upload 2 PDFs → AI compliance analysis + test case generation |
| GET | `/api/comparisons` | List last 20 statement comparisons |
| POST | `/api/cycles` | Create a new QA test cycle |
| GET | `/api/cycles` | List all cycles with pass/fail stats |
| GET | `/api/cycles/{id}` | Get single cycle detail |
| POST | `/api/cycles/{id}/testcases/bulk` | Bulk-add test cases to a cycle |
| GET | `/api/cycles/{id}/testcases` | Get all test cases for a cycle |
| PATCH | `/api/testcases/{id}` | Update test case status + actual result |
| POST | `/api/defects` | Log defect — triggers AI RCA automatically |
| GET | `/api/defects` | List all defects with AI root cause |
| PATCH | `/api/defects/{id}` | Update defect status + resolution |
| GET | `/api/stats` | Dashboard stats — pass rate, SLA %, defect counts |
| POST | `/api/sql/execute` | Run SELECT query (non-SELECT blocked) |
| GET | `/api/cycles/{id}/export` | Download 3-sheet Excel QA report |

---

## 🧪 Testing — 22 PyTest Scripts

Test coverage across all 16 endpoints:

```
Health & Root          → test_health_check, test_root
Stats & Dashboard      → test_get_stats, test_stats_pass_rate_in_range
Test Cycles            → test_create_cycle, test_get_cycles,
                         test_cycle_has_required_fields, test_get_single_cycle,
                         test_get_nonexistent_cycle (404 validation)
Test Cases             → test_add_bulk_test_cases, test_get_test_cases,
                         test_update_test_case_status,
                         test_pass_rate_updates_after_execution
Defects                → test_create_defect, test_get_defects,
                         test_defect_has_ai_rca, test_update_defect_status
SQL Validator          → test_sql_select_query, test_sql_blocks_non_select,
                         test_sql_invalid_query, test_sql_count_query
Comparisons            → test_comparisons_endpoint
```

Run tests locally:
```bash
cd backend
pytest tests/test_api.py -v
```

---

## 🖥️ Mainframe Terminal — IBM 3270 Emulator

The platform includes a functional green screen terminal emulating an IBM 3270 mainframe environment used in financial services:

**Boot Sequence:**
```
CONNECTING TO FINANCIAL MAINFRAME...
AUTHENTICATING...
SESSION ESTABLISHED — CICS REGION: SYFPROD1

  [OK] FISERV CORE BANKING GATEWAY       — v18.4.2   CONNECTED
  [OK] FIRST DATA PAYMENT NETWORK        — TXN READY CONNECTED
  [OK] CONTENT NAVIGATOR CMS             — v3.2.1    CONNECTED
  [OK] CONSUMER CENTER PORTAL            — LIVE       CONNECTED
  [OK] GROQ AI INFERENCE ENGINE          — LLaMA 3.1 ONLINE
  [OK] STATEMENTSENSE QA DB              — PostgreSQL CONNECTED
```

**Available Commands:**
| Command | Description |
|---|---|
| `STATUS` | System status, SLA adherence, compliance score |
| `SYSTEMS` | All connected financial system details |
| `CYCLES` | Live test cycle list from DB |
| `DEFECTS` | Open defects report from DB |
| `SLA` | SLA adherence report with targets vs actuals |
| `COMPLIANCE` | Last statement comparison results |
| `QUERY` | Enter SQL query mode — live SELECT against PostgreSQL |
| `CLEAR` | Clear terminal screen |

---

## 📊 Excel Report — 3 Sheets

Each exported QA report contains:

**Sheet 1 — Executive Summary**
KPI table with Target vs Actual vs Status (PASS/FAIL) for: Total Cases, Pass Rate, Execution Rate, Critical Defects, Defect Leakage Rate, SLA Adherence

**Sheet 2 — Test Cases**
Full test case log with TC ID, Title, Category, Priority, Expected Result, Actual Result, Status — color-coded by outcome

**Sheet 3 — Defect Log**
All defects with Severity, Status, Manual Root Cause, and AI-generated Root Cause columns

---

## ☁️ Deployment — Step by Step

### Step 1 — RDS PostgreSQL Setup
Created a managed PostgreSQL 18 database on AWS RDS (Free Tier, `db.t4g.micro`). Enabled public access and configured the `statementsense-sg` security group to allow inbound on port 5432.

### Step 2 — EC2 Instance Launch
Launched Ubuntu 22.04 LTS EC2 (`t2.micro`, Free Tier). Created key pair `statementsense-key.pem`. Configured security group inbound rules:
- Port 22 — SSH
- Port 80 — HTTP
- Port 443 — HTTPS
- Port 8000 — FastAPI backend

### Step 3 — Docker Setup on EC2
```bash
# SSH into EC2
ssh -i statementsense-key.pem ubuntu@<EC2-PUBLIC-IP>

# Install Docker
sudo apt update
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 4 — Backend Deployment
```bash
# Clone repo
git clone https://github.com/pranavsaai/StatementSense.git
cd StatementSense/backend

# Create .env
echo "DATABASE_URL=postgresql://postgres:PASSWORD@RDS-ENDPOINT:5432/postgres" > .env
echo "GROQ_API_KEY=your_groq_api_key" >> .env

# Build and run container
docker build -t statementsense-backend .
docker run -d \
  --name statementsense \
  --env-file .env \
  -p 8000:8000 \
  --restart always \
  statementsense-backend

# Verify
docker logs statementsense
curl http://localhost:8000/health
```

### Step 5 — Frontend Build
```bash
# Update EC2 IP in api.js
# Then build locally
cd frontend
npm install
npm run build
# dist/ folder is ready for S3 upload
```

### Step 6 — S3 Static Hosting
1. Create S3 bucket → disable "Block all public access"
2. Enable static website hosting → index document: `index.html`
3. Apply public read bucket policy
4. Upload contents of `dist/` folder

### Step 7 — CloudFront CDN
1. Create CloudFront distribution
2. Origin: S3 static website endpoint (not S3 bucket directly)
3. Enable HTTPS redirect
4. Deploy → app served globally via edge network

---

## 🔐 Environment Variables

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres
GROQ_API_KEY=your_groq_api_key_here
```

> Never commit `.env` to version control. It is in `.gitignore`.

---

## 🧑‍💻 Local Development

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## 👤 Author

**Pranav Sai Kuchipudi**
B.Tech Computer Science — GITAM University (2022–2026)

Built and deployed end-to-end: FastAPI backend on EC2 (Docker), PostgreSQL on RDS, React frontend on S3 + CloudFront, Groq AI integration, 22 PyTest scripts, IBM 3270 mainframe terminal emulator, and automated Excel QA reporting.

GitHub: [github.com/pranavsaai](https://github.com/pranavsaai)
