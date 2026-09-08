from fastapi import APIRouter, HTTPException, Header

from config.supabase import supabase
from schemas.auth import LoginRequest


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post("/login")
def login(data: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        user = response.user
        session = response.session

        if not user or not session:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Get LANDIA profile + role
        profile = (
            supabase
            .table("Users")
            .select("id, name, email, role")
            .eq("email", data.email)
            .single()
            .execute()
        )

        if not profile.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )

        return {
            "access_token": session.access_token,
            "user": profile.data
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


def get_current_user(
    authorization: str = Header(None)
):
    """
    Verify the Supabase access token
    and return the LANDIA user profile + role.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.replace("Bearer ", "")

    try:
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        auth_user = user_response.user

        if not auth_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        # Get LANDIA profile + role
        profile = (
            supabase
            .table("Users")
            .select("id, name, email, role")
            .eq("email", auth_user.email)
            .single()
            .execute()
        )

        if not profile.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )

        return profile.data

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )