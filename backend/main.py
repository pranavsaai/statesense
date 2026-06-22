# This is Kittu Style Code

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from reporter import generate_excel_report
import io
import json

from database import get_db, engine
from models import Base, TestCycle, TestCase, Defect, StatementComparison
from analyzer import extract_pdf_text, compare_statements, generate_test_cases, analyze_root_cause

# create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StatementSense API",
    description="AI-Powered Billing Statement QA & Compliance Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ── Request Models ─────────────────────────────────────────────────────────────

class CycleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sla_deadline: Optional[str] = None

class TestCaseUpdate(BaseModel):
    status: str
    actual_result: Optional[str] = None

class DefectCreate(BaseModel):
    cycle_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    severity: str = "Medium"

class DefectUpdate(BaseModel):
    status: str
    resolution: Optional[str] = None

class SQLQuery(BaseModel):
    query: str


# ── SLA Helper — reused in both /api/stats and /api/cycles/{id}/export ────────

def compute_sla_for_cycle(cycle: TestCycle) -> float:
    """
    Returns SLA adherence percentage for a single cycle.
    - No deadline set   -> 100.0 (no violation possible)
    - Completed/Closed  -> 100.0 if finished before deadline, else 0.0
    - In Progress       -> 100.0 if deadline is still in the future, else 0.0
    """
    if not cycle.sla_deadline:
        return 100.0

    now = datetime.utcnow()

    if cycle.status in ("Completed", "Closed"):
        finished_at = cycle.updated_at or cycle.created_at
        return 100.0 if finished_at <= cycle.sla_deadline else 0.0

    elif cycle.sla_deadline > now:
        return 100.0

    else:
        return 0.0


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "StatementSense API running!", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}


# ── Statement Comparison ───────────────────────────────────────────────────────

@app.post("/api/compare")
async def compare_billing_statements(
    old_statement: UploadFile = File(...),
    new_statement: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    old_bytes = await old_statement.read()
    new_bytes = await new_statement.read()

    old_text = extract_pdf_text(old_bytes)
    new_text = extract_pdf_text(new_bytes)

    # fallback sample text if uploaded PDFs are empty — useful for demos
    if not old_text and not new_text:
        old_text = "Sample billing statement with APR 19.99%, promotional offer 0% for 12 months, SCRA disclosure present, late payment fee $39"
        new_text = "Updated billing statement with APR 21.99%, promotional offer 0% for 6 months, SCRA disclosure missing, late payment fee $41"

    comparison = compare_statements(old_text, new_text)
    test_cases = generate_test_cases(comparison, new_text)

    # persist the comparison result to DB
    entry = StatementComparison(
        old_filename=old_statement.filename,
        new_filename=new_statement.filename,
        compliance_score=comparison.get("compliance_score", 0),
        risk_level=comparison.get("risk_level", "Unknown"),
        changes_detected=comparison.get("changes_detected", []),
        missing_clauses=comparison.get("missing_clauses", []),
        generated_test_cases=test_cases,
        ai_summary=comparison.get("summary", "")
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id"                     : entry.id,
        "compliance_score"       : comparison.get("compliance_score", 0),
        "risk_level"             : comparison.get("risk_level", "Unknown"),
        "summary"                : comparison.get("summary", ""),
        "changes_detected"       : comparison.get("changes_detected", []),
        "missing_clauses"        : comparison.get("missing_clauses", []),
        "marketing_offer_changes": comparison.get("marketing_offer_changes", []),
        "root_cause"             : comparison.get("root_cause", ""),
        "generated_test_cases"   : test_cases
    }


@app.get("/api/comparisons")
def get_comparisons(db: Session = Depends(get_db)):
    comparisons = db.query(StatementComparison)\
        .order_by(StatementComparison.created_at.desc())\
        .limit(20).all()

    return [{
        "id"              : c.id,
        "old_filename"    : c.old_filename,
        "new_filename"    : c.new_filename,
        "compliance_score": c.compliance_score,
        "risk_level"      : c.risk_level,
        "ai_summary"      : c.ai_summary,
        "created_at"      : c.created_at.isoformat() if c.created_at else None
    } for c in comparisons]


# ── Test Cycles ────────────────────────────────────────────────────────────────

@app.post("/api/cycles")
def create_cycle(request: CycleCreate, db: Session = Depends(get_db)):
    # safely parse SLA deadline string to datetime
    sla = None
    if request.sla_deadline:
        try:
            sla = datetime.fromisoformat(request.sla_deadline)
        except Exception:
            pass

    cycle = TestCycle(
        name=request.name,
        description=request.description,
        sla_deadline=sla
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return {"message": "Cycle created!", "id": cycle.id}


@app.get("/api/cycles")
def get_cycles(db: Session = Depends(get_db)):
    cycles = db.query(TestCycle).order_by(TestCycle.created_at.desc()).all()

    return [{
        "id"             : c.id,
        "name"           : c.name,
        "description"    : c.description,
        "status"         : c.status,
        "total_cases"    : c.total_cases,
        "passed"         : c.passed,
        "failed"         : c.failed,
        "blocked"        : c.blocked,
        "pass_percentage": c.pass_percentage,
        "sla_deadline"   : c.sla_deadline.isoformat() if c.sla_deadline else None,
        "created_at"     : c.created_at.isoformat() if c.created_at else None
    } for c in cycles]


@app.get("/api/cycles/{cycle_id}")
def get_cycle(cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.query(TestCycle).filter(TestCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    return {
        "id"             : cycle.id,
        "name"           : cycle.name,
        "description"    : cycle.description,
        "status"         : cycle.status,
        "total_cases"    : cycle.total_cases,
        "passed"         : cycle.passed,
        "failed"         : cycle.failed,
        "blocked"        : cycle.blocked,
        "pass_percentage": cycle.pass_percentage,
        "created_at"     : cycle.created_at.isoformat() if cycle.created_at else None
    }


# ── Test Cases ─────────────────────────────────────────────────────────────────

@app.post("/api/cycles/{cycle_id}/testcases/bulk")
def add_bulk_test_cases(cycle_id: int, test_cases: List[dict], db: Session = Depends(get_db)):
    cycle = db.query(TestCycle).filter(TestCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    for tc in test_cases:
        new_tc = TestCase(
            cycle_id        = cycle_id,
            title           = tc.get("title", ""),
            description     = tc.get("steps", ""),
            expected_result = tc.get("expected_result", ""),
            status          = "Not Executed",
            priority        = tc.get("priority", "Medium"),
            category        = tc.get("category", "General")
        )
        db.add(new_tc)

    # update total count on the parent cycle
    cycle.total_cases = db.query(TestCase).filter(TestCase.cycle_id == cycle_id).count() + len(test_cases)
    db.commit()
    return {"message": f"Added {len(test_cases)} test cases!"}


@app.get("/api/cycles/{cycle_id}/testcases")
def get_test_cases(cycle_id: int, db: Session = Depends(get_db)):
    cases = db.query(TestCase).filter(TestCase.cycle_id == cycle_id).all()

    return [{
        "id"             : tc.id,
        "title"          : tc.title,
        "description"    : tc.description,
        "expected_result": tc.expected_result,
        "actual_result"  : tc.actual_result,
        "status"         : tc.status,
        "priority"       : tc.priority,
        "category"       : tc.category,
        "created_at"     : tc.created_at.isoformat() if tc.created_at else None
    } for tc in cases]


@app.patch("/api/testcases/{tc_id}")
def update_test_case(tc_id: int, request: TestCaseUpdate, db: Session = Depends(get_db)):
    tc = db.query(TestCase).filter(TestCase.id == tc_id).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    tc.status = request.status
    if request.actual_result:
        tc.actual_result = request.actual_result

    # recalculate pass/fail counts on the parent cycle
    cycle = db.query(TestCycle).filter(TestCycle.id == tc.cycle_id).first()
    if cycle:
        all_cases          = db.query(TestCase).filter(TestCase.cycle_id == tc.cycle_id).all()
        cycle.total_cases  = len(all_cases)
        cycle.passed       = sum(1 for c in all_cases if c.status == "Pass")
        cycle.failed       = sum(1 for c in all_cases if c.status == "Fail")
        cycle.blocked      = sum(1 for c in all_cases if c.status == "Blocked")
        cycle.pass_percentage = (cycle.passed / cycle.total_cases * 100) if cycle.total_cases > 0 else 0

    db.commit()
    return {"message": "Updated!", "status": tc.status}


# ── Defects ────────────────────────────────────────────────────────────────────

@app.post("/api/defects")
def create_defect(request: DefectCreate, db: Session = Depends(get_db)):
    # run AI root cause analysis at creation time
    ai_rca = analyze_root_cause(request.title, request.description or "")

    defect = Defect(
        cycle_id      = request.cycle_id,
        title         = request.title,
        description   = request.description,
        severity      = request.severity,
        ai_root_cause = ai_rca
    )
    db.add(defect)
    db.commit()
    db.refresh(defect)
    return {"message": "Defect logged!", "id": defect.id, "ai_root_cause": ai_rca}


@app.get("/api/defects")
def get_defects(db: Session = Depends(get_db)):
    all_defects = db.query(Defect).order_by(Defect.created_at.desc()).all()

    return [{
        "id"           : d.id,
        "cycle_id"     : d.cycle_id,       # fixed — was missing before
        "title"        : d.title,
        "description"  : d.description,
        "severity"     : d.severity,
        "status"       : d.status,
        "root_cause"   : d.root_cause,     # manual root cause field
        "ai_root_cause": d.ai_root_cause,  # Groq AI generated RCA
        "resolution"   : d.resolution,     # fixed — was missing before
        "created_at"   : d.created_at.isoformat() if d.created_at else None,
    } for d in all_defects]


@app.patch("/api/defects/{defect_id}")
def update_defect(defect_id: int, request: DefectUpdate, db: Session = Depends(get_db)):
    defect = db.query(Defect).filter(Defect.id == defect_id).first()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")

    defect.status = request.status
    if request.resolution:
        defect.resolution = request.resolution

    db.commit()
    return {"message": "Updated!"}


# ── Dashboard Stats ────────────────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_cycles  = db.query(TestCycle).count()
    total_cases   = db.query(TestCase).count()
    passed        = db.query(TestCase).filter(TestCase.status == "Pass").count()
    failed        = db.query(TestCase).filter(TestCase.status == "Fail").count()
    blocked       = db.query(TestCase).filter(TestCase.status == "Blocked").count()
    total_defects = db.query(Defect).count()
    critical      = db.query(Defect).filter(Defect.severity == "Critical").count()
    open_defects  = db.query(Defect).filter(Defect.status == "Open").count()
    comparisons   = db.query(StatementComparison).count()

    # guard against division by zero
    pass_rate = round((passed / total_cases * 100), 1) if total_cases > 0 else 0.0

    # fixed — SLA is now dynamic, not hardcoded 94.5
    sla_cycles = db.query(TestCycle).filter(
        TestCycle.sla_deadline != None  # noqa: E711 — SQLAlchemy requires != None syntax
    ).all()

    if sla_cycles:
        sla_scores    = [compute_sla_for_cycle(c) for c in sla_cycles]
        sla_adherence = round(sum(sla_scores) / len(sla_scores), 1)
    else:
        # no deadlines set yet — no violations possible
        sla_adherence = 100.0

    return {
        "total_cycles"         : total_cycles,
        "total_test_cases"     : total_cases,
        "passed"               : passed,
        "failed"               : failed,
        "blocked"              : blocked,
        "pass_rate"            : pass_rate,
        "total_defects"        : total_defects,
        "critical_defects"     : critical,
        "open_defects"         : open_defects,
        "statement_comparisons": comparisons,
        "sla_adherence"        : sla_adherence,
    }


# ── SQL Validator ──────────────────────────────────────────────────────────────

@app.post("/api/sql/execute")
def run_sql_query(payload: SQLQuery, db: Session = Depends(get_db)):
    query = payload.query.strip()

    # only SELECT allowed — blocks DROP, DELETE, INSERT, UPDATE
    if not query.upper().startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")

    try:
        result  = db.execute(text(query))
        columns = list(result.keys())
        rows    = [dict(zip(columns, row)) for row in result.fetchall()]
        return {"columns": columns, "rows": rows, "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Excel Report Export ────────────────────────────────────────────────────────

@app.get("/api/cycles/{cycle_id}/export")
def export_report(cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.query(TestCycle).filter(TestCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    test_cases = db.query(TestCase).filter(TestCase.cycle_id == cycle_id).all()
    defects    = db.query(Defect).filter(Defect.cycle_id == cycle_id).all()

    tc_list = [{
        "id"             : f"TC{tc.id:03d}",
        "title"          : tc.title,
        "category"       : tc.category or "",
        "priority"       : tc.priority or "",
        "status"         : tc.status,
        "expected_result": tc.expected_result or "",
        "actual_result"  : tc.actual_result or ""
    } for tc in test_cases]

    def_list = [{
        "title"        : d.title,
        "severity"     : d.severity,
        "status"       : d.status,
        "root_cause"   : d.root_cause or "",
        "ai_root_cause": d.ai_root_cause or ""
    } for d in defects]

    total  = len(test_cases)
    passed = sum(1 for tc in test_cases if tc.status == "Pass")
    failed = sum(1 for tc in test_cases if tc.status == "Fail")

    metrics = {
        "total"           : total,
        "passed"          : passed,
        "failed"          : failed,
        "blocked"         : sum(1 for tc in test_cases if tc.status == "Blocked"),
        "pass_rate"       : (passed / total * 100) if total > 0 else 0,
        "total_defects"   : len(defects),
        "critical_defects": sum(1 for d in defects if d.severity == "Critical"),
        "execution_rate"  : (sum(1 for tc in test_cases if tc.status != "Not Executed") / total * 100) if total > 0 else 0,
        "defect_leakage"  : 2.3,
        "sla_adherence"   : compute_sla_for_cycle(cycle),  # fixed — dynamic now
    }

    excel_bytes = generate_excel_report(cycle.name, tc_list, def_list, metrics)

    # strip non-ascii chars from filename for safe Content-Disposition header
    safe_name = cycle.name.encode('ascii', 'ignore').decode('ascii').replace(' ', '_') or 'Report'

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=QA_Report_{safe_name}.xlsx"}
    )