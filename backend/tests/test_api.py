import pytest
import requests

BASE_URL = "http://127.0.0.1:8000"

# ── Health Check ───────────────────────────────────────────────────────────────

def test_health_check():
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_root():
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200
    assert "StatementSense" in res.json()["message"]

# ── Stats ──────────────────────────────────────────────────────────────────────

def test_get_stats():
    res = requests.get(f"{BASE_URL}/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_cycles" in data
    assert "pass_rate" in data
    assert "total_defects" in data
    assert "sla_adherence" in data

def test_stats_pass_rate_in_range():
    res = requests.get(f"{BASE_URL}/api/stats")
    data = res.json()
    assert 0 <= data["pass_rate"] <= 100

# ── Test Cycles ────────────────────────────────────────────────────────────────

def test_create_cycle():
    payload = {"name": "Automated Test Cycle", "description": "Created by PyTest"}
    res = requests.post(f"{BASE_URL}/api/cycles", json=payload)
    assert res.status_code == 200
    assert "id" in res.json()

def test_get_cycles():
    res = requests.get(f"{BASE_URL}/api/cycles")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_cycle_has_required_fields():
    res = requests.get(f"{BASE_URL}/api/cycles")
    cycles = res.json()
    if len(cycles) > 0:
        cycle = cycles[0]
        assert "id" in cycle
        assert "name" in cycle
        assert "status" in cycle
        assert "pass_percentage" in cycle
        assert "total_cases" in cycle

def test_get_single_cycle():
    # Create one first
    payload = {"name": "Single Cycle Test"}
    create_res = requests.post(f"{BASE_URL}/api/cycles", json=payload)
    cycle_id = create_res.json()["id"]

    res = requests.get(f"{BASE_URL}/api/cycles/{cycle_id}")
    assert res.status_code == 200
    assert res.json()["id"] == cycle_id

def test_get_nonexistent_cycle():
    res = requests.get(f"{BASE_URL}/api/cycles/99999")
    assert res.status_code == 404

# ── Test Cases ─────────────────────────────────────────────────────────────────

def test_add_bulk_test_cases():
    # Create a cycle first
    cycle_res = requests.post(f"{BASE_URL}/api/cycles", json={"name": "Bulk TC Test"})
    cycle_id = cycle_res.json()["id"]

    test_cases = [
        {"title": "Verify APR disclosure", "category": "Compliance", "priority": "High",
         "expected_result": "APR present", "steps": "1. Open statement\n2. Check APR section"},
        {"title": "Verify SCRA disclosure", "category": "Compliance", "priority": "High",
         "expected_result": "SCRA present", "steps": "1. Search SCRA section"},
        {"title": "Validate marketing offer", "category": "Marketing", "priority": "Medium",
         "expected_result": "Offer matches approved terms", "steps": "1. Check offer section"},
    ]

    res = requests.post(f"{BASE_URL}/api/cycles/{cycle_id}/testcases/bulk", json=test_cases)
    assert res.status_code == 200

def test_get_test_cases():
    # Create cycle and add cases
    cycle_res = requests.post(f"{BASE_URL}/api/cycles", json={"name": "TC Fetch Test"})
    cycle_id = cycle_res.json()["id"]

    requests.post(f"{BASE_URL}/api/cycles/{cycle_id}/testcases/bulk", json=[
        {"title": "Test Case 1", "category": "Compliance", "priority": "High", "expected_result": "Pass"}
    ])

    res = requests.get(f"{BASE_URL}/api/cycles/{cycle_id}/testcases")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) > 0

def test_update_test_case_status():
    # Create cycle + case
    cycle_res = requests.post(f"{BASE_URL}/api/cycles", json={"name": "Update TC Test"})
    cycle_id = cycle_res.json()["id"]

    requests.post(f"{BASE_URL}/api/cycles/{cycle_id}/testcases/bulk", json=[
        {"title": "Status Update Test", "category": "Compliance", "priority": "High", "expected_result": "Pass"}
    ])

    cases = requests.get(f"{BASE_URL}/api/cycles/{cycle_id}/testcases").json()
    tc_id = cases[0]["id"]

    res = requests.patch(f"{BASE_URL}/api/testcases/{tc_id}", json={"status": "Pass", "actual_result": "APR displayed correctly"})
    assert res.status_code == 200
    assert res.json()["status"] == "Pass"

def test_pass_rate_updates_after_execution():
    cycle_res = requests.post(f"{BASE_URL}/api/cycles", json={"name": "Pass Rate Test"})
    cycle_id = cycle_res.json()["id"]

    requests.post(f"{BASE_URL}/api/cycles/{cycle_id}/testcases/bulk", json=[
        {"title": "TC1", "category": "Compliance", "priority": "High", "expected_result": "Pass"},
        {"title": "TC2", "category": "Compliance", "priority": "High", "expected_result": "Pass"},
    ])

    cases = requests.get(f"{BASE_URL}/api/cycles/{cycle_id}/testcases").json()
    requests.patch(f"{BASE_URL}/api/testcases/{cases[0]['id']}", json={"status": "Pass"})
    requests.patch(f"{BASE_URL}/api/testcases/{cases[1]['id']}", json={"status": "Fail"})

    cycle = requests.get(f"{BASE_URL}/api/cycles/{cycle_id}").json()
    assert cycle["pass_percentage"] == 50.0

# ── Defects ────────────────────────────────────────────────────────────────────

def test_create_defect():
    payload = {"title": "APR disclosure missing", "description": "APR not showing on page 1", "severity": "Critical"}
    res = requests.post(f"{BASE_URL}/api/defects", json=payload)
    assert res.status_code == 200
    assert "id" in res.json()

def test_get_defects():
    res = requests.get(f"{BASE_URL}/api/defects")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_defect_has_ai_rca():
    payload = {"title": "SCRA disclosure missing", "description": "SCRA not present on statement", "severity": "High"}
    res = requests.post(f"{BASE_URL}/api/defects", json=payload)
    data = res.json()
    assert "ai_root_cause" in data
    assert data["ai_root_cause"] is not None

def test_update_defect_status():
    payload = {"title": "Test Defect for Status Update", "severity": "Medium"}
    create_res = requests.post(f"{BASE_URL}/api/defects", json=payload)
    defect_id = create_res.json()["id"]

    res = requests.patch(f"{BASE_URL}/api/defects/{defect_id}", json={"status": "Fixed"})
    assert res.status_code == 200

# ── SQL Validator ──────────────────────────────────────────────────────────────

def test_sql_select_query():
    res = requests.post(f"{BASE_URL}/api/sql/execute", json={"query": "SELECT * FROM test_cycles"})
    assert res.status_code == 200
    data = res.json()
    assert "columns" in data
    assert "rows" in data

def test_sql_blocks_non_select():
    res = requests.post(f"{BASE_URL}/api/sql/execute", json={"query": "DROP TABLE test_cycles"})
    assert res.status_code == 400

def test_sql_invalid_query():
    res = requests.post(f"{BASE_URL}/api/sql/execute", json={"query": "SELECT * FROM nonexistent_table_xyz"})
    assert res.status_code == 400

def test_sql_count_query():
    res = requests.post(f"{BASE_URL}/api/sql/execute", json={"query": "SELECT COUNT(*) FROM defects"})
    assert res.status_code == 200
    assert res.json()["count"] == 1

# ── Compliance ─────────────────────────────────────────────────────────────────

def test_comparisons_endpoint():
    res = requests.get(f"{BASE_URL}/api/comparisons")
    assert res.status_code == 200
    assert isinstance(res.json(), list)