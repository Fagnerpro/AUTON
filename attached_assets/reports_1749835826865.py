# Placeholder para endpoints de relatórios
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_reports():
    return {"message": "Endpoint de relatórios em desenvolvimento"}

