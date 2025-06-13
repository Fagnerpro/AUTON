from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class OrganizationType(str, enum.Enum):
    """Tipos de organização."""
    CONSTRUCTION = "construction"
    ENGINEERING = "engineering"
    INSTALLER = "installer"
    CONSULTANT = "consultant"
    GOVERNMENT = "government"
    OTHER = "other"

class Organization(Base):
    """Modelo de organização/empresa."""
    
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=True)
    type = Column(Enum(OrganizationType), nullable=False)
    
    # Informações de contato
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Endereço
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(10), nullable=True)
    
    # Configurações
    is_active = Column(Boolean, default=True, nullable=False)
    subscription_plan = Column(String(50), default="free", nullable=False)
    max_users = Column(Integer, default=5, nullable=False)
    max_simulations = Column(Integer, default=100, nullable=False)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    users = relationship("UserOrganization", back_populates="organization")
    simulations = relationship("Simulation", back_populates="organization")
    
    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', type='{self.type}')>"

class UserOrganization(Base):
    """Relacionamento entre usuário e organização."""
    
    __tablename__ = "user_organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    
    # Papel na organização
    role = Column(String(50), default="member", nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="users")
    
    def __repr__(self):
        return f"<UserOrganization(user_id={self.user_id}, org_id={self.organization_id}, role='{self.role}')>"

