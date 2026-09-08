from fastapi import APIRouter

from services.workflow_service import update_status

router = APIRouter(
    prefix="/api/projects",
    tags=["Workflow"]
)


@router.post("/{project_id}/submit")
def submit_project(project_id: str):
    return update_status(
        project_id,
        "PROPOSAL",
        "VERIFICATION"
    )


@router.post("/{project_id}/verify")
def verify_project(project_id: str):
    return update_status(
        project_id,
        "VERIFICATION",
        "APPROVAL"
    )


@router.post("/{project_id}/approve")
def approve_project(project_id: str):
    return update_status(
        project_id,
        "APPROVAL",
        "COMPLETED"
    )