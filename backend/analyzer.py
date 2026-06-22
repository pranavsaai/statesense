import os
import json
import fitz
from groq import Groq
from dotenv import load_dotenv
from typing import Dict, Any, List

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


# Extract text from PDF using PyMuPDF
def extract_pdf_text(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


# Compare two billing statements using Groq AI
def compare_statements(old_text: str, new_text: str) -> Dict[str, Any]:
    if not os.getenv("GROQ_API_KEY"):
        return _mock_comparison()

    prompt = f"""You are a senior banking compliance analyst specializing in billing statement validation for financial services companies like Synchrony Financial.

Compare these two billing statement versions and provide a detailed compliance analysis:

OLD STATEMENT:
{old_text[:3000]}

NEW STATEMENT:
{new_text[:3000]}

Respond ONLY with a valid JSON object in exactly this format:
{{
    "compliance_score": 85,
    "risk_level": "Medium",
    "summary": "Brief 2-3 sentence summary of key changes",
    "changes_detected": [
        {{"type": "Marketing Offer", "description": "APR changed from 19.99% to 21.99%", "severity": "HIGH"}},
        {{"type": "Compliance Clause", "description": "Late payment warning text modified", "severity": "MEDIUM"}}
    ],
    "missing_clauses": [
        {{"clause": "SCRA Disclosure", "required": true, "risk": "HIGH"}},
        {{"clause": "Annual Fee Notice", "required": true, "risk": "MEDIUM"}}
    ],
    "marketing_offer_changes": [
        {{"field": "Promotional APR", "old_value": "0% for 12 months", "new_value": "0% for 6 months"}}
    ],
    "root_cause": "Template version mismatch between Q1 and Q2 statement cycles"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1500
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        return json.loads(content)

    except Exception as e:
        return _mock_comparison()


# Generate test cases from statement comparison
def generate_test_cases(comparison_result: Dict, statement_text: str) -> List[Dict]:
    if not os.getenv("GROQ_API_KEY"):
        return _mock_test_cases()

    changes = comparison_result.get("changes_detected", [])
    missing = comparison_result.get("missing_clauses", [])

    prompt = f"""You are a QA analyst for a financial services company like Synchrony.
Based on the following billing statement changes and missing compliance clauses, generate specific test cases.

CHANGES DETECTED:
{json.dumps(changes, indent=2)}

MISSING CLAUSES:
{json.dumps(missing, indent=2)}

Generate exactly 8 test cases. Respond ONLY with a valid JSON array:
[
    {{
        "id": "TC001",
        "title": "Verify APR disclosure is present",
        "category": "Compliance",
        "priority": "High",
        "steps": "1. Open billing statement\\n2. Navigate to APR section\\n3. Verify APR value matches approved rate",
        "expected_result": "APR disclosure section present with correct value",
        "status": "Not Executed"
    }}
]"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        return json.loads(content)

    except Exception as e:
        return _mock_test_cases()


# AI Root Cause Analysis for defects
def analyze_root_cause(defect_title: str, defect_description: str) -> str:
    if not os.getenv("GROQ_API_KEY"):
        return "Template version mismatch detected. Review statement configuration."

    prompt = f"""You are a senior QA analyst for a financial services company.
Analyze this defect and provide a concise root cause analysis in 2-3 sentences.

Defect Title: {defect_title}
Defect Description: {defect_description}

Provide root cause analysis focusing on banking/statement testing context.
Respond with just the root cause analysis text, nothing else."""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Root cause analysis unavailable: {str(e)}"


# Mock data when no API key
def _mock_comparison():
    return {
        "compliance_score": 72,
        "risk_level": "High",
        "summary": "Significant changes detected in APR disclosures and marketing offer terms. Three mandatory compliance clauses are missing from the new statement version.",
        "changes_detected": [
            {"type": "Marketing Offer", "description": "Promotional APR changed from 0% for 12 months to 0% for 6 months", "severity": "HIGH"},
            {"type": "Compliance Clause", "description": "Late payment warning text modified without legal approval", "severity": "HIGH"},
            {"type": "Statement Format", "description": "SCRA disclosure section relocated to page 3", "severity": "MEDIUM"}
        ],
        "missing_clauses": [
            {"clause": "SCRA Military Disclosure", "required": True, "risk": "HIGH"},
            {"clause": "Annual Percentage Rate Table", "required": True, "risk": "HIGH"},
            {"clause": "Dispute Resolution Notice", "required": True, "risk": "MEDIUM"}
        ],
        "marketing_offer_changes": [
            {"field": "Promotional APR Duration", "old_value": "12 months", "new_value": "6 months"},
            {"field": "Cash Back Rate", "old_value": "2%", "new_value": "1.5%"}
        ],
        "root_cause": "Statement template version mismatch between Q1 and Q2 billing cycles"
    }


def _mock_test_cases():
    return [
        {"id": "TC001", "title": "Verify APR disclosure present", "category": "Compliance", "priority": "High", "steps": "1. Open statement\n2. Check APR section\n3. Verify value", "expected_result": "APR disclosure present with correct value", "status": "Not Executed"},
        {"id": "TC002", "title": "Verify SCRA military disclosure", "category": "Compliance", "priority": "High", "steps": "1. Search for SCRA section\n2. Verify text matches template", "expected_result": "SCRA disclosure present on page 1", "status": "Not Executed"},
        {"id": "TC003", "title": "Validate promotional offer terms", "category": "Marketing", "priority": "High", "steps": "1. Check offer section\n2. Compare with approved terms", "expected_result": "Promotional APR matches approved offer", "status": "Not Executed"},
        {"id": "TC004", "title": "Verify late payment warning", "category": "Compliance", "priority": "Medium", "steps": "1. Locate late payment section\n2. Compare with legal approved text", "expected_result": "Late payment warning matches approved template", "status": "Not Executed"},
        {"id": "TC005", "title": "Validate minimum payment calculation", "category": "Financial", "priority": "High", "steps": "1. Check minimum payment field\n2. Verify calculation formula", "expected_result": "Minimum payment calculated correctly", "status": "Not Executed"},
        {"id": "TC006", "title": "Verify dispute resolution notice", "category": "Compliance", "priority": "Medium", "steps": "1. Search for dispute section\n2. Verify contact information", "expected_result": "Dispute resolution notice present", "status": "Not Executed"},
        {"id": "TC007", "title": "Validate cash back offer percentage", "category": "Marketing", "priority": "Medium", "steps": "1. Check rewards section\n2. Verify cash back percentage", "expected_result": "Cash back rate matches approved 2%", "status": "Not Executed"},
        {"id": "TC008", "title": "Verify statement date and cycle", "category": "Format", "priority": "Low", "steps": "1. Check statement date\n2. Verify billing cycle dates", "expected_result": "Statement dates are accurate", "status": "Not Executed"}
    ]