from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class TestCycle(Base):
    __tablename__ = "test_cycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="In Progress")
    sla_deadline = Column(DateTime, nullable=True)
    total_cases = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    blocked = Column(Integer, default=0)
    pass_percentage = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    test_cases = relationship("TestCase", back_populates="cycle")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("test_cycles.id"))
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    expected_result = Column(Text, nullable=True)
    actual_result = Column(Text, nullable=True)
    status = Column(String(50), default="Not Executed")
    priority = Column(String(50), default="Medium")
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    cycle = relationship("TestCycle", back_populates="test_cases")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("test_cycles.id"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), default="Medium")
    status = Column(String(50), default="Open")
    root_cause = Column(Text, nullable=True)
    ai_root_cause = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StatementComparison(Base):
    __tablename__ = "statement_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    old_filename = Column(String(255), nullable=True)
    new_filename = Column(String(255), nullable=True)
    compliance_score = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)
    changes_detected = Column(JSON, nullable=True)
    missing_clauses = Column(JSON, nullable=True)
    generated_test_cases = Column(JSON, nullable=True)
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())