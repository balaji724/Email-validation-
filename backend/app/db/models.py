import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    jobs = relationship("ValidationJob", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    usage_events = relationship("UsageEvent", back_populates="user")

class ValidationJob(Base):
    __tablename__ = "validation_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    total_rows = Column(Integer, default=0, nullable=False)
    processed_rows = Column(Integer, default=0, nullable=False)
    valid_count = Column(Integer, default=0, nullable=False)
    invalid_count = Column(Integer, default=0, nullable=False)
    risky_count = Column(Integer, default=0, nullable=False)
    unknown_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False, index=True)
    progress_percent = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    user = relationship("User", back_populates="jobs")
    results = relationship("ValidationResult", back_populates="job", cascade="all, delete-orphan")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("validation_jobs.id"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    original_email = Column(String(255), nullable=False)
    normalized_email = Column(String(255), nullable=False, index=True)
    syntax_status = Column(String(50), nullable=False)
    domain_status = Column(String(50), nullable=False)
    mx_status = Column(String(50), nullable=False)
    disposable_status = Column(Boolean, default=False, nullable=False)
    role_based = Column(Boolean, default=False, nullable=False)
    is_duplicate = Column(Boolean, default=False, nullable=False)
    final_status = Column(String(50), nullable=False, index=True)
    score = Column(Integer, default=0, nullable=False)
    comment = Column(Text, nullable=True)
    validated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("ValidationJob", back_populates="results")

Index("idx_validation_job_status", ValidationResult.job_id, ValidationResult.final_status)

class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    monthly_price = Column(Integer, nullable=False)
    annual_price = Column(Integer, nullable=False)
    monthly_credit_limit = Column(Integer, nullable=False)
    bulk_upload_limit = Column(Integer, nullable=False)
    features = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    subscriptions = relationship("Subscription", back_populates="plan")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    plan_id = Column(String(50), ForeignKey("plans.id"), nullable=False)
    status = Column(String(50), default="active", nullable=False)
    billing_provider = Column(String(50), nullable=True)
    provider_subscription_id = Column(String(255), nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")

class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    job_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="usage_events")
