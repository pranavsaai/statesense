# StatementSense 🧾

> **AI-Powered Billing Statement QA & Compliance Platform**

StatementSense is a full-stack web application that uses AI to compare billing statements, detect compliance issues, generate test cases, log defects, and export QA reports — all in one platform.

---

## 🚀 Live Demo

| Service | URL |
|---|---|
| Frontend | `https://d3cn3tr2o5mx6e.cloudfront.net` |
| Backend API | `http://3.84.212.66:8000` |
| API Docs (Swagger) | `http://3.84.212.66:8000/docs` |

---

## 🧠 What It Does

- **Statement Comparison** — Upload two billing PDFs; AI detects changes in APR, fees, SCRA disclosures, promotional offers, and missing compliance clauses
- **Compliance Scoring** — Each comparison gets a compliance score and risk level (Low / Medium / High / Critical)
- **AI Test Case Generation** — Automatically generates structured test cases from detected changes using Groq LLM
- **Test Cycle Management** — Create and manage QA test cycles, execute test cases, track pass/fail/blocked status
- **Defect Tracking** — Log defects with AI-generated root cause analysis
- **SQL Validator** — Run live SELECT queries against the database from the UI
- **Excel Report Export** — One-click export of full QA reports per cycle in `.xlsx` format
- **Dashboard** — Real-time stats: pass rate, SLA adherence, open defects, comparisons run

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     USER BROWSER                     │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────────────┐
│              AWS CloudFront (CDN)                    │
│         Global edge delivery + HTTPS                 │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│               AWS S3 (Frontend)                      │
│    React + Vite static build (dist/)                 │
│    Static website hosting enabled                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              AWS EC2 (Backend)                       │
│         Ubuntu 22.04 LTS — t2.micro                 │
│    ┌─────────────────────────────────────────┐      │
│    │         Docker Container                │      │
│    │   FastAPI + Uvicorn — Port 8000         │      │
│    └─────────────────────────────────────────┘      │
└─────────────────┬───────────────────────────────────┘
                  │ PostgreSQL (port 5432)
┌─────────────────▼───────────────────────────────────┐
│              AWS RDS (Database)                      │
│    PostgreSQL 18 — db.t4g.micro (Free Tier)         │
│    Managed backups + high availability               │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Recharts | Dashboard charts |
| Lucide React | Icons |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| SQLAlchemy | ORM |
| PostgreSQL | Relational database |
| Groq API | AI (LLM) for analysis & RCA |
| PyMuPDF | PDF text extraction |
| OpenPyXL | Excel report generation |
| Python Dotenv | Environment config |
| Psycopg2 | PostgreSQL driver |

### Infrastructure (AWS)
| Service | Role |
|---|---|
| EC2 (t2.micro) | Backend server — runs Docker container |
| RDS PostgreSQL | Managed database (db.t4g.micro) |
| S3 | Frontend static file hosting |
| CloudFront | CDN — global HTTPS delivery |
| Docker | Container runtime on EC2 |
| Security Groups | Network firewall (ports 22, 80, 443, 8000, 5432) |

---

## 📁 Project Structure

```
statementsense/
├── backend/
│   ├── main.py          # FastAPI app — all routes & endpoints
│   ├── models.py        # SQLAlchemy DB models
│   ├── database.py      # DB engine + session setup
│   ├── analyzer.py      # PDF extraction + Groq AI analysis
│   ├── reporter.py      # Excel report generation
│   ├── Dockerfile       # Container definition
│   ├── requirements.txt # Python dependencies
│   └── .env             # Secrets (not committed)
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js        # Axios API calls
    │   └── components/
    │       ├── Dashboard.jsx
    │       ├── Compare.jsx
    │       ├── TestCycles.jsx
    │       ├── Defects.jsx
    │       ├── SQLValidator.jsx
    │       ├── Mainframe.jsx
    │       └── Navbar.jsx
    ├── index.html
    └── package.json
```

---

## 🗄️ Database Models

- **TestCycle** — QA cycles with SLA deadlines, pass/fail tracking
- **TestCase** — Individual test cases linked to cycles
- **Defect** — Bug reports with AI root cause analysis
- **StatementComparison** — PDF comparison results with compliance scores

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/compare` | Compare two PDF statements |
| GET | `/api/comparisons` | List past comparisons |
| POST | `/api/cycles` | Create test cycle |
| GET | `/api/cycles` | List all cycles |
| GET | `/api/cycles/{id}` | Get cycle detail |
| POST | `/api/cycles/{id}/testcases/bulk` | Bulk add test cases |
| GET | `/api/cycles/{id}/testcases` | Get test cases |
| PATCH | `/api/testcases/{id}` | Update test case status |
| POST | `/api/defects` | Log defect (with AI RCA) |
| GET | `/api/defects` | List all defects |
| PATCH | `/api/defects/{id}` | Update defect status |
| GET | `/api/stats` | Dashboard statistics |
| POST | `/api/sql/execute` | Run SELECT query |
| GET | `/api/cycles/{id}/export` | Download Excel report |

---

## ☁️ Deployment Steps (How We Did It)

### Step 1 — RDS PostgreSQL
Created a managed PostgreSQL database on AWS RDS (Free Tier, db.t4g.micro). Enabled public access and configured the security group to allow inbound traffic on port 5432.

### Step 2 — EC2 Instance
Launched an Ubuntu 22.04 LTS EC2 instance (t2.micro, Free Tier). Created a key pair (`statementsense-key.pem`) and configured the `statementsense-sg` security group with inbound rules for SSH (22), HTTP (80), HTTPS (443), and the API port (8000).

### Step 3 — Docker Setup on EC2
SSH'd into EC2 via Git Bash on Windows, installed Docker and docker-compose, and added the ubuntu user to the docker group.

### Step 4 — Backend Deployment
Cloned the repository, created a `.env` file with the RDS connection string and Groq API key, wrote a Dockerfile, and built + ran the container:

```bash
docker build -t statementsense-backend .
docker run -d --name statementsense --env-file .env -p 8000:8000 --restart always statementsense-backend
```

### Step 5 — Frontend Build
Updated `src/api.js` with the EC2 public IP, then built the React app locally:

```bash
npm install
npm run build
```

### Step 6 — S3 Static Hosting
Created an S3 bucket, disabled "Block all public access", enabled static website hosting with `index.html` as the index and error document, and applied a public read bucket policy. Uploaded the `dist/` folder contents.

### Step 7 — CloudFront CDN
Created a CloudFront distribution pointing to the S3 static website endpoint with HTTPS enabled. The app is now served globally via CloudFront's edge network.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres
GROQ_API_KEY=your_groq_api_key_here
```

---

## 🧑‍💻 Local Development

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 👤 Author

**Pranav Sai**
Built and deployed end-to-end on AWS — EC2, RDS, S3, CloudFront — with Docker containerization and Groq AI integration.
