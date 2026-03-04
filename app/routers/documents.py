"""
Document upload, listing, verify/reject, and download router.
"""
import os
import hashlib
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.config import get_settings
from app.models.user import User
from app.models.person import Person
from app.models.document import Document, DocType, DocStatus
from app.schemas.document import (
    DocumentUploadResponse, DocumentListResponse,
    DocumentVerifyRequest, DocumentRejectRequest, DocumentDownloadResponse,
)
from app.audit import record_audit

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    request: Request,
    person_id: int = Form(...),
    doc_type: str = Form(..., description="AADHAAR | PAN | COLLEGE_ID | PHOTO | RESUME | ADDRESS_PROOF"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a document. Stores file locally and saves metadata to DB."""
    # Verify person exists
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Access check: self or admin
    is_own = person.user_id == current_user.id
    is_admin = current_user.role.value in ("ADMIN", "HR")
    if not is_own and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    settings = get_settings()
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(person_id))
    os.makedirs(upload_dir, exist_ok=True)

    # Read file content
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    # Save file
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    file_key = f"{person_id}/{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_key)
    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        person_id=person_id,
        doc_type=DocType(doc_type),
        file_key=file_key,
        original_filename=file.filename,
        mime_type=file.content_type,
        size_bytes=len(content),
        file_hash=file_hash,
        status=DocStatus.UPLOADED,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    record_audit(db, current_user.id, "Document", doc.id, "UPLOAD",
                 after={"doc_type": doc_type, "filename": file.filename}, request=request)
    return doc


@router.get("", response_model=list[DocumentListResponse])
def list_documents(
    person_id: int = Query(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: list documents for a person."""
    docs = db.query(Document).filter(Document.person_id == person_id).order_by(Document.id).all()
    record_audit(db, current_user.id, "Document", person_id, "LIST_VIEW", request=request)
    return docs


@router.get("/{doc_id}/download-url", response_model=DocumentDownloadResponse)
def get_download_url(
    doc_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a download URL for a document. For MVP, returns a local static path."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Access check
    person = db.query(Person).filter(Person.id == doc.person_id).first()
    is_own = person and person.user_id == current_user.id
    is_admin = current_user.role.value in ("ADMIN", "HR")
    if not is_own and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # For MVP: return the local file path as URL
    settings = get_settings()
    download_url = f"/uploads/{doc.file_key}"

    record_audit(db, current_user.id, "Document", doc.id, "DOWNLOAD",
                 after={"file_key": doc.file_key}, request=request)

    return DocumentDownloadResponse(download_url=download_url, expires_in_seconds=3600)


@router.post("/{doc_id}/verify", response_model=DocumentListResponse)
def verify_document(
    doc_id: int,
    data: DocumentVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: mark a document as verified."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = DocStatus.VERIFIED
    doc.verified_by = current_user.id
    doc.verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doc)

    record_audit(db, current_user.id, "Document", doc.id, "VERIFY", request=request)
    return doc


@router.post("/{doc_id}/reject", response_model=DocumentListResponse)
def reject_document(
    doc_id: int,
    data: DocumentRejectRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "HR")),
):
    """Admin: reject a document with notes."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = DocStatus.REJECTED
    doc.rejection_notes = data.notes
    doc.verified_by = current_user.id
    doc.verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doc)

    record_audit(db, current_user.id, "Document", doc.id, "REJECT",
                 after={"notes": data.notes}, request=request)
    return doc
