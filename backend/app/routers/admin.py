"""Pengelolaan data siswa (khusus akun guru)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from ..deps import get_auth, get_repo, teacher_user
from ..services.accounts import AccountError, create_account

router = APIRouter(prefix="/api/admin", tags=["admin"])


class NewStudent(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    class_name: str = Field(default="", max_length=20)
    student_code: str | None = Field(default=None, max_length=20)


class UpdateStudent(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=80)
    class_name: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None


def _student_row(p: dict) -> dict:
    stats = p.get("user_stats") or {}
    if isinstance(stats, list):
        stats = stats[0] if stats else {}
    return {"id": p["id"], "full_name": p["full_name"], "student_code": p["student_code"],
            "class_name": p.get("class_name"), "is_active": p.get("is_active", True),
            "total_xp": stats.get("total_xp", 0), "level": stats.get("level", 1),
            "lessons_completed": stats.get("lessons_completed", 0), "games_played": stats.get("games_played", 0)}


@router.get("/students")
def list_students(_teacher=Depends(teacher_user), repo=Depends(get_repo)):
    return {"students": [_student_row(p) for p in repo.list_students()]}


@router.post("/students", status_code=201)
def add_student(body: NewStudent, request: Request, _teacher=Depends(teacher_user),
                repo=Depends(get_repo), auth=Depends(get_auth)):
    try:
        profile = create_account(repo, auth, request.app.state.settings, full_name=body.full_name,
                                 class_name=body.class_name, code=body.student_code)
    except AccountError as exc:
        raise HTTPException(422, str(exc)) from exc
    return {"student": _student_row(profile)}


@router.patch("/students/{student_id}")
def update_student(student_id: str, body: UpdateStudent, _teacher=Depends(teacher_user), repo=Depends(get_repo)):
    target = repo.get_profile(student_id)
    if not target or target.get("role") != "student":
        raise HTTPException(404, "Siswa tidak ditemukan.")
    fields = body.model_dump(exclude_none=True)
    if not fields:
        raise HTTPException(422, "Tidak ada perubahan.")
    updated = repo.update_profile(student_id, fields)
    return {"student": _student_row(updated or target)}
