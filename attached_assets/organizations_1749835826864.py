# Placeholder para endpoints de organizações
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_organizations():
    return {"message": "Endpoint de organizações em desenvolvimento"}

