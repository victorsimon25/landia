from fastapi import FastAPI
from config.supabase import supabase
from config.database import client, projects_collection
from routes.auth import router as auth_router   
from routes.projects import router as projects_router
from routes.workflow import router as workflow_router

app = FastAPI(title="LANDIA Backend")
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(workflow_router)

@app.get("/")
def root():
    return {"message": "LANDIA Backend is running"}


@app.get("/health/supabase")
def supabase_health():
    try:
        response = supabase.table("Users").select("id").limit(5).execute()

        return {
            "status": "ok",
            "message": "Supabase connection is working",
            "users_found": len(response.data)
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/health/db")
def database_health():
    try:
        client.admin.command("ping")

        count = projects_collection.count_documents({})

        return {
            "status": "ok",
            "message": "MongoDB connection and projects collection are working",
            "projects_count": count
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }