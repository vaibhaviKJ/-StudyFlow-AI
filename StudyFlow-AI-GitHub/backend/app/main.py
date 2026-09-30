import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth_router, roadmap_router, quiz_router, progress_router, assistant_router, materials_router

# Auto-create tables (MySQL DB itself must already exist — see schema.sql / README)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StudyFlow AI API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if origins == "*" else origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(roadmap_router.router)
app.include_router(quiz_router.router)
app.include_router(progress_router.router)
app.include_router(assistant_router.router)
app.include_router(materials_router.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "StudyFlow AI API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
