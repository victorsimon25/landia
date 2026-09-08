from fastapi import HTTPException
from config.database import projects_collection


def update_status(project_id: str, expected_status: str, new_status: str):
    project = projects_collection.find_one(
        {"project_id": project_id}
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project["status"] != expected_status:
        raise HTTPException(
            status_code=400,
            detail=f"Project must be in {expected_status} stage"
        )

    projects_collection.update_one(
        {"project_id": project_id},
        {"$set": {"status": new_status}}
    )

    updated = projects_collection.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )

    return updated