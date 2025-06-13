from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import structlog

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.simulation import (
    SimulationResponse, 
    SimulationCreate, 
    SimulationUpdate,
    SimulationCalculateRequest,
    SimulationCalculateResponse
)
from app.services.simulation_service import SimulationService

logger = structlog.get_logger()
router = APIRouter()

@router.get("/", response_model=List[SimulationResponse])
async def get_simulations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Listar simulações do usuário."""
    
    simulation_service = SimulationService(db)
    simulations = await simulation_service.get_user_simulations(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return simulations

@router.post("/", response_model=SimulationResponse)
async def create_simulation(
    simulation_data: SimulationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Criar nova simulação."""
    
    simulation_service = SimulationService(db)
    simulation = await simulation_service.create(
        simulation_data=simulation_data,
        user_id=current_user.id
    )
    
    logger.info("Simulação criada", simulation_id=simulation.id, user_id=current_user.id)
    
    return simulation

@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(
    simulation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Obter simulação por ID."""
    
    simulation_service = SimulationService(db)
    simulation = await simulation_service.get(simulation_id)
    
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulação não encontrada"
        )
    
    # Verificar se usuário tem acesso à simulação
    if simulation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    return simulation

@router.put("/{simulation_id}", response_model=SimulationResponse)
async def update_simulation(
    simulation_id: int,
    simulation_update: SimulationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Atualizar simulação."""
    
    simulation_service = SimulationService(db)
    simulation = await simulation_service.get(simulation_id)
    
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulação não encontrada"
        )
    
    # Verificar se usuário tem acesso à simulação
    if simulation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    updated_simulation = await simulation_service.update(simulation_id, simulation_update)
    
    logger.info("Simulação atualizada", simulation_id=simulation_id, user_id=current_user.id)
    
    return updated_simulation

@router.delete("/{simulation_id}")
async def delete_simulation(
    simulation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Deletar simulação."""
    
    simulation_service = SimulationService(db)
    simulation = await simulation_service.get(simulation_id)
    
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulação não encontrada"
        )
    
    # Verificar se usuário tem acesso à simulação
    if simulation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    await simulation_service.delete(simulation_id)
    
    logger.info("Simulação deletada", simulation_id=simulation_id, user_id=current_user.id)
    
    return {"message": "Simulação deletada com sucesso"}

@router.post("/calculate", response_model=SimulationCalculateResponse)
async def calculate_simulation(
    calculation_data: SimulationCalculateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Calcular simulação solar sem salvar."""
    
    simulation_service = SimulationService(db)
    results = await simulation_service.calculate(calculation_data)
    
    logger.info("Cálculo de simulação realizado", user_id=current_user.id, type=calculation_data.type)
    
    return results

@router.post("/{simulation_id}/calculate", response_model=SimulationResponse)
async def calculate_and_save_simulation(
    simulation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Calcular e salvar resultados da simulação."""
    
    simulation_service = SimulationService(db)
    simulation = await simulation_service.get(simulation_id)
    
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulação não encontrada"
        )
    
    # Verificar se usuário tem acesso à simulação
    if simulation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    updated_simulation = await simulation_service.calculate_and_save(simulation_id)
    
    logger.info("Simulação calculada e salva", simulation_id=simulation_id, user_id=current_user.id)
    
    return updated_simulation

