from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class SimulationType(str, enum.Enum):
    """Tipos de simulação."""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    COMMON_AREAS = "common_areas"
    EV_CHARGING = "ev_charging"

class SimulationStatus(str, enum.Enum):
    """Status da simulação."""
    DRAFT = "draft"
    COMPLETED = "completed"
    APPROVED = "approved"
    REJECTED = "rejected"

class Simulation(Base):
    """Modelo de simulação solar."""
    
    __tablename__ = "simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(SimulationType), nullable=False)
    status = Column(Enum(SimulationStatus), default=SimulationStatus.DRAFT)
    
    # Relacionamentos
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Dados de localização
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Parâmetros de entrada (JSON)
    input_parameters = Column(JSON, nullable=False)
    
    # Resultados da simulação (JSON)
    results = Column(JSON, nullable=True)
    
    # Configurações técnicas
    solar_radiation = Column(Float, nullable=True)  # kWh/m²/dia
    system_efficiency = Column(Float, default=0.8)
    panel_power = Column(Integer, default=550)  # Wp
    panel_area = Column(Float, default=2.1)  # m²
    
    # Análise financeira
    total_investment = Column(Float, nullable=True)
    annual_savings = Column(Float, nullable=True)
    payback_years = Column(Float, nullable=True)
    roi_percentage = Column(Float, nullable=True)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    user = relationship("User", back_populates="simulations")
    organization = relationship("Organization", back_populates="simulations")
    reports = relationship("SimulationReport", back_populates="simulation")
    
    def __repr__(self):
        return f"<Simulation(id={self.id}, name='{self.name}', type='{self.type}')>"

class SimulationReport(Base):
    """Modelo de relatório de simulação."""
    
    __tablename__ = "simulation_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    
    # Informações do relatório
    title = Column(String(255), nullable=False)
    format = Column(String(10), default="pdf")  # pdf, excel, json
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    
    # Configurações do relatório
    template = Column(String(100), default="standard")
    include_charts = Column(Boolean, default=True)
    include_technical_specs = Column(Boolean, default=True)
    include_financial_analysis = Column(Boolean, default=True)
    
    # Campos de auditoria
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    simulation = relationship("Simulation", back_populates="reports")
    
    def __repr__(self):
        return f"<SimulationReport(id={self.id}, simulation_id={self.simulation_id}, format='{self.format}')>"

