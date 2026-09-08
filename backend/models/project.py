from datetime import datetime


def create_project_document(
    project_id: str,
    name: str,
    district: str,
    created_by: str
):
    return {
        "project_id": project_id,
        "name": name,
        "district": district,
        "status": "PROPOSAL",
        "created_by": created_by,
        "created_at": datetime.utcnow()
    }