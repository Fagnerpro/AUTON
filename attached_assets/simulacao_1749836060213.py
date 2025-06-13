from sqlalchemy import Column, Integer, Float
from app.db.base_class import Base

class Simulacao(Base):
    __tablename__ = "simulacoes"
    id = Column(Integer, primary_key=True, index=True)
    consumo_kwh = Column(Float, nullable=False)
    geracao_estimativa = Column(Float, nullable=False)
