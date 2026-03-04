"""
Startup Employee & Intern Management System – FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from app.database import engine, Base

# Import ALL models so create_all registers them
from app.models import (  # noqa: F401
    ItemModel,
    User, Person, OfferTemplate, OfferLetter,
    OnboardingSubmission, Document, AttendanceRecord,
    CompensationProfile, Payout, Payslip, AuditLog,
)

# Import routers
from app.routers import main as main_router
from app.routers import items as items_router
from app.routers import auth as auth_router
from app.routers import people as people_router
from app.routers import offers as offers_router
from app.routers import onboarding as onboarding_router
from app.routers import documents as documents_router
from app.routers import attendance as attendance_router
from app.routers import compensation as compensation_router
from app.routers import audit as audit_router

app = FastAPI(
    title="Startup Employee & Intern Management System",
    description="Role-based backend for managing interns, employees, onboarding, documents, attendance, and payroll.",
    version="1.0.0",
)

# CORS – allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register legacy routers
app.include_router(main_router.router)
app.include_router(items_router.router)

# Register new management system routers
app.include_router(auth_router.router)
app.include_router(people_router.router)
app.include_router(offers_router.router)
app.include_router(onboarding_router.router)
app.include_router(documents_router.router)
app.include_router(attendance_router.router)
app.include_router(compensation_router.router)
app.include_router(audit_router.router)


@app.on_event("startup")
def on_startup():
    """Create all tables in the database if they don't exist."""
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Root"])
async def root():
    html = """
    <!DOCTYPE html>
    <html>
    <head><title>Startup Management System API</title></head>
    <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>🚀 Startup Employee & Intern Management System</h1>
        <p>Backend API is running.</p>
        <ul>
            <li><a href="/docs">📖 Swagger UI (Interactive API Docs)</a></li>
            <li><a href="/redoc">📋 ReDoc (API Reference)</a></li>
        </ul>
        <h3>API Groups</h3>
        <ul>
            <li>🔐 Authentication – <code>/api/v1/auth/</code></li>
            <li>👥 People – <code>/api/v1/people</code></li>
            <li>📄 Offer Letters – <code>/api/v1/offers/</code></li>
            <li>📋 Onboarding – <code>/api/v1/onboarding/</code></li>
            <li>📁 Documents – <code>/api/v1/documents/</code></li>
            <li>📅 Attendance – <code>/api/v1/attendance/</code></li>
            <li>💰 Compensation – <code>/api/v1/compensation/</code></li>
            <li>🔍 Audit Logs – <code>/api/v1/audit</code></li>
        </ul>
    </body>
    </html>
    """
    return HTMLResponse(html)
