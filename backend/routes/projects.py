from fastapi import APIRouter, HTTPException

from schemas.project import ProjectCreate
from services.project_service import (
    create_project,
    get_all_projects,
    get_project
)

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("/")
def create(data: ProjectCreate):
    project_id = "LA-" + str(
        len(get_all_projects()) + 1
    ).zfill(3)

    return create_project(
        project_id=project_id,
        name=data.name,
        district=data.district,
        created_by="admin@landia.com"
    )


@router.get("/")
def get_all():
    return get_all_projects()


@router.get("/{project_id}")
def get_one(project_id: str):
    project = get_project(project_id)

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project