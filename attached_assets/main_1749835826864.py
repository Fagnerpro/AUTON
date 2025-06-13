from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import structlog

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.api_v1.api import api_router

# Configurar logging estruturado
setup_logging()
logger = structlog.get_logger()

def create_application() -> FastAPI:
    """Criar e configurar a aplicação FastAPI."""
    
    app = FastAPI(
        title="AUTON® Enterprise API",
        description="Sistema de Simulação Solar Empresarial",
        version="1.0.0",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    )

    # Middleware de CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Middleware de hosts confiáveis
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS
        )

    # Incluir rotas da API
    app.include_router(api_router, prefix="/api/v1")

    @app.on_event("startup")
    async def startup_event():
        logger.info("AUTON® Enterprise API iniciando...", version="1.0.0")

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("AUTON® Enterprise API finalizando...")

    @app.get("/health")
    async def health_check():
        """Endpoint de verificação de saúde da API."""
        return {
            "status": "healthy",
            "service": "auton-enterprise-api",
            "version": "1.0.0"
        }

    return app

app = create_application()

