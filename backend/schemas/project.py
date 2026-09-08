from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    district: str


class ProjectResponse(BaseModel):
    project_id: str
    name: str
    district: str
    status: str
    created_by: str