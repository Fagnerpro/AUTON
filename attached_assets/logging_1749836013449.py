import structlog
import logging
import sys
from typing import Any, Dict
from app.core.config import settings

def setup_logging() -> None:
    """Configurar logging estruturado para a aplicação."""
    
    # Configurar nível de log
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Configurar processadores do structlog
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]
    
    # Adicionar processador de formato baseado na configuração
    if settings.LOG_FORMAT == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    
    # Configurar structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configurar logging padrão do Python
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

def get_logger(name: str = None) -> structlog.BoundLogger:
    """Obter logger estruturado."""
    return structlog.get_logger(name)

class LoggerMixin:
    """Mixin para adicionar logger a classes."""
    
    @property
    def logger(self) -> structlog.BoundLogger:
        return get_logger(self.__class__.__name__)

