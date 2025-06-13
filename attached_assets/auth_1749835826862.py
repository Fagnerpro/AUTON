from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import structlog

from app.core.database import get_db
from app.core.security import security_manager, get_current_user
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserRegister
from app.schemas.user import UserResponse
from app.services.user_service import UserService

logger = structlog.get_logger()
router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """Autenticar usuário e retornar tokens de acesso."""
    
    user = security_manager.authenticate_user(
        db, form_data.username, form_data.password
    )
    
    if not user:
        logger.warning("Tentativa de login falhada", email=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo"
        )
    
    # Criar tokens
    access_token_expires = timedelta(minutes=30)
    access_token = security_manager.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security_manager.create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    # Atualizar último login
    user_service = UserService(db)
    await user_service.update_last_login(user.id)
    
    logger.info("Login realizado com sucesso", user_id=user.id, email=user.email)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800  # 30 minutos
    }

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
) -> Any:
    """Registrar novo usuário."""
    
    user_service = UserService(db)
    
    # Verificar se email já existe
    existing_user = await user_service.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Criar novo usuário
    user = await user_service.create(user_data)
    
    logger.info("Usuário registrado", user_id=user.id, email=user.email)
    
    return user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
) -> Any:
    """Renovar token de acesso usando refresh token."""
    
    payload = security_manager.verify_token(refresh_token, "refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inválido"
        )
    
    # Criar novo access token
    access_token_expires = timedelta(minutes=30)
    access_token = security_manager.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Obter informações do usuário atual."""
    return current_user

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Fazer logout do usuário."""
    # Em uma implementação completa, adicionaríamos o token a uma blacklist
    logger.info("Logout realizado", user_id=current_user.id)
    return {"message": "Logout realizado com sucesso"}

