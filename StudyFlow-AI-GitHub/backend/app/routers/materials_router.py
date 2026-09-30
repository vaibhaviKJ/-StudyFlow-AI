import json
import re
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from .. import ai_service, auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/materials", tags=["materials"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024


def _as_material_out(material: models.StudyMaterial) -> schemas.MaterialOut:
    return schemas.MaterialOut(
        id=material.id,
        filename=material.filename,
        summary=material.summary,
        important_topics=json.loads(material.important_topics),
        flashcards=json.loads(material.flashcards),
        created_at=material.created_at,
    )


def _extract_pdf_text(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as exc:
        raise HTTPException(422, "This PDF could not be read. Try a text-based PDF instead.") from exc


@router.post("/upload", response_model=schemas.MaterialOut)
async def upload_material(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    filename = Path(file.filename or "study-material.pdf").name
    if Path(filename).suffix.lower() != ".pdf":
        raise HTTPException(415, "Only PDF study material is supported.")

    content = await file.read()
    if not content or len(content) > MAX_FILE_SIZE:
        raise HTTPException(413, "Choose a PDF smaller than 10 MB.")
    text = _extract_pdf_text(content)
    if len(text) < 80:
        raise HTTPException(422, "No readable text was found. Scanned PDFs need OCR before upload.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = UPLOAD_DIR / f"{uuid4().hex}.pdf"
    destination.write_bytes(content)
    pack = await ai_service.generate_study_pack(filename, text)
    material = models.StudyMaterial(
        user_id=current_user.id,
        filename=filename,
        storage_path=str(destination),
        extracted_text=text[:120000],
        summary=pack["summary"],
        important_topics=json.dumps(pack["important_topics"]),
        flashcards=json.dumps(pack["flashcards"]),
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return _as_material_out(material)


@router.get("", response_model=list[schemas.MaterialListItem])
def list_materials(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    materials = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.user_id == current_user.id
    ).order_by(models.StudyMaterial.created_at.desc()).all()
    return [
        schemas.MaterialListItem(
            id=item.id,
            filename=item.filename,
            important_topics=json.loads(item.important_topics),
            created_at=item.created_at,
        )
        for item in materials
    ]


@router.get("/{material_id}", response_model=schemas.MaterialOut)
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    material = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.id == material_id,
        models.StudyMaterial.user_id == current_user.id,
    ).first()
    if not material:
        raise HTTPException(404, "Study material not found")
    return _as_material_out(material)


@router.post("/{material_id}/questions", response_model=schemas.MaterialQuizOut)
async def generate_material_questions(
    material_id: int,
    payload: schemas.MaterialQuizRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    material = db.query(models.StudyMaterial).filter(
        models.StudyMaterial.id == material_id,
        models.StudyMaterial.user_id == current_user.id,
    ).first()
    if not material:
        raise HTTPException(404, "Study material not found")
    roadmap = db.query(models.Roadmap).filter(
        models.Roadmap.user_id == current_user.id,
        models.Roadmap.status == "active",
    ).order_by(models.Roadmap.created_at.desc()).first()
    if not roadmap:
        raise HTTPException(409, "Create a study roadmap before taking a material quiz.")
    roadmap_day = next(
        (day for day in roadmap.days if day.status == "in_progress"),
        next((day for day in roadmap.days if day.status == "pending"), None),
    )
    if not roadmap_day:
        raise HTTPException(409, "This roadmap has no available study day.")

    count = max(1, min(payload.num_questions, 50))
    questions = await ai_service.generate_quiz_from_material(
        material.filename, material.extracted_text, count
    )
    return schemas.MaterialQuizOut(roadmap_day_id=roadmap_day.id, questions=questions)
