from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
import redis
from app.core.config import settings

# Configurar engine do PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# Configurar session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos SQLAlchemy
Base = declarative_base()

# Configurar Redis
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_db() -> Generator[Session, None, None]:
    """Dependency para obter sessão do banco de dados."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_redis() -> redis.Redis:
    """Dependency para obter cliente Redis."""
    return redis_client

class DatabaseManager:
    """Gerenciador de conexões com banco de dados."""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def create_tables(self):
        """Criar todas as tabelas no banco de dados."""
        Base.metadata.create_all(bind=self.engine)
    
    def drop_tables(self):
        """Remover todas as tabelas do banco de dados."""
        Base.metadata.drop_all(bind=self.engine)
    
    def get_session(self) -> Session:
        """Obter nova sessão do banco de dados."""
        return self.SessionLocal()

# Instância global do gerenciador
db_manager = DatabaseManager()

