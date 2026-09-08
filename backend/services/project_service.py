from config.database import projects_collection
from models.project import create_project_document


def create_project(project_id, name, district, created_by):
    project = create_project_document(
        project_id,
        name,
        district,
        created_by
    )

    projects_collection.insert_one(project)

    return {
    "project_id": project["project_id"],
    "name": project["name"],
    "district": project["district"],
    "status": project["status"],
    "created_by": project["created_by"]
}


def get_all_projects():
    return list(projects_collection.find({}, {"_id": 0}))


def get_project(project_id):
    return projects_collection.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )