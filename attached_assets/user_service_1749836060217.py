from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import structlog

from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserUpdate, UserRegister
from app.core.security import security_manager

logger = structlog.get_logger()

class UserService:
    """Serviço para operações de usuário."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get(self, user_id: int) -> Optional[User]:
        """Obter usuário por ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Obter usuário por email."""
        return self.db.query(User).filter(User.email == email).first()
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[User]:
        """Obter múltiplos usuários."""
        query = self.db.query(User)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    async def create(self, user_data: UserCreate) -> User:
        """Criar novo usuário."""
        hashed_password = security_manager.get_password_hash(user_data.password)
        
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            company=user_data.company,
            phone=user_data.phone,
            role=user_data.role,
            status=UserStatus.PENDING,
            is_active=True,
            is_verified=False
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info("Usuário criado", user_id=db_user.id, email=db_user.email)
        
        return db_user
    
    async def update(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Atualizar usuário."""
        db_user = await self.get(user_id)
        
        if not db_user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db_user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info("Usuário atualizado", user_id=user_id)
        
        return db_user
    
    async def delete(self, user_id: int) -> bool:
        """Deletar usuário."""
        db_user = await self.get(user_id)
        
        if not db_user:
            return False
        
        self.db.delete(db_user)
        self.db.commit()
        
        logger.info("Usuário deletado", user_id=user_id)
        
        return True
    
    async def update_last_login(self, user_id: int) -> bool:
        """Atualizar último login do usuário."""
        db_user = await self.get(user_id)
        
        if not db_user:
            return False
        
        db_user.last_login = datetime.utcnow()
        self.db.commit()
        
        return True
    
    async def activate_user(self, user_id: int) -> Optional[User]:
        """Ativar usuário."""
        db_user = await self.get(user_id)
        
        if not db_user:
            return None
        
        db_user.is_active = True
        db_user.status = UserStatus.ACTIVE
        db_user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info("Usuário ativado", user_id=user_id)
        
        return db_user
    
    async def deactivate_user(self, user_id: int) -> Optional[User]:
        """Desativar usuário."""
        db_user = await self.get(user_id)
        
        if not db_user:
            return None
        
        db_user.is_active = False
        db_user.status = UserStatus.INACTIVE
        db_user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info("Usuário desativado", user_id=user_id)
        
        return db_user
    
    async def verify_user(self, user_id: int) -> Optional[User]:
        """Verificar usuário."""
        db_user = await self.get(user_id)
        
        if not db_user:
            return None
        
        db_user.is_verified = True
        db_user.status = UserStatus.ACTIVE
        db_user.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_user)
        
        logger.info("Usuário verificado", user_id=user_id)
        
        return db_user

