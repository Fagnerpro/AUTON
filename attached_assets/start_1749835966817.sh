
#!/bin/bash

# Ativar ambiente virtual (opcional)
# source venv/bin/activate

# Exportar PYTHONPATH para permitir importações absolutas
export PYTHONPATH=./app

# Subir containers docker
docker-compose up --build -d

# Rodar backend manualmente (caso não esteja usando docker-compose para o FastAPI)
# uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
