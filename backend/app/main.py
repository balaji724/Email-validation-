from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from typing import Optional, List
from datetime import datetime
import json

from backend.app.core.config import settings
from backend.app.services.email_validator import validate_email
from backend.app.schemas.email_validation import SingleValidationRequest, SingleValidationResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-accuracy deliverability and bulk email verification SaaS engine.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "version": settings.VERSION,
        "service": "EmailCheck Pro Python Backend",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.post("/api/v1/validate/single", response_model=SingleValidationResponse)
def validate_single(payload: SingleValidationRequest):
    result = validate_email(payload.email, payload.treat_role_as_risky)
    return result

@app.get("/api/v1/usage")
def get_usage():
    return {
        "plan_id": "starter",
        "plan_name": "Starter Pro",
        "credits_limit": 10000,
        "credits_used": 1420,
        "credits_remaining": 8580,
    }

@app.get("/api/v1/plans")
def get_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free Community",
                "monthly_price": 0,
                "annual_price": 0,
                "monthly_credit_limit": 100,
                "bulk_upload_limit": 100,
                "features": ["100 validations/mo", "RFC 5322 syntax", "DNS MX lookups"],
                "is_active": True,
            },
            {
                "id": "starter",
                "name": "Starter Pro",
                "monthly_price": 29,
                "annual_price": 290,
                "monthly_credit_limit": 10000,
                "bulk_upload_limit": 5000,
                "features": ["10,000 validations/mo", "Excel & CSV exports", "Disposable filter", "Duplicate detector"],
                "is_active": True,
            },
            {
                "id": "professional",
                "name": "Business Scale",
                "monthly_price": 79,
                "annual_price": 790,
                "monthly_credit_limit": 50000,
                "bulk_upload_limit": 25000,
                "features": ["50,000 validations/mo", "Multi-sheet workbooks", "Priority DNS cluster"],
                "is_active": True,
            }
        ]
    }
