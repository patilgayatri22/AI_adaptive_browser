# Adaptive Agent Browser Service - Docker Setup

Multi-team development environment for the Agent Browser Service (ABS) project.

##  Architecture Overview

This Docker setup supports two independent teams working on different components:

### **Team 1: MCP - Playwright**
- **Focus**: Multi-strategy action grounding module
- **Technologies**: Playwright, GPT-4V, Vision-based detection, DOM matching
- **Port**: 8001
- **Responsibilities**:
  - Vision-based element detection
  - Text-based DOM matching
  - Rule-based heuristics
  - Confidence-routed controller

### **Team 2: Infrastructure**
- **Focus**: Database, workflows, evaluation framework
- **Technologies**: MySQL, VectorDB (Qdrant), Celery
- **Port**: 8002
- **Responsibilities**:
  - Workflow creation and storage
  - Cross-user knowledge sharing (PII-safe)
  - Evaluation metrics (TSR, latency, cost, F1 score)
  - Database management

### **Shared Services**
- **Redis**: Message broker and caching
- **MySQL**: Primary relational database
- **VectorDB (Qdrant)**: Workflow embeddings and semantic search
- **Prometheus + Grafana**: Monitoring (optional)

---

##  Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- 8GB+ RAM available for Docker
- Git

### 1. Clone and Setup

```bash
cd agent-browser
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and fill in:
```bash
# Required
OPENAI_API_KEY=sk-your-key-here
MYSQL_ROOT_PASSWORD=your-secure-password
MYSQL_PASSWORD=your-secure-password

# Generate encryption key
python -c "import secrets; print(secrets.token_hex(32))"
# Copy output to:
PII_ENCRYPTION_KEY=<generated-key>
```

### 3. Start All Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f mcp-playwright
docker-compose logs -f infra-service
```

### 4. Verify Services

```bash
# Check all containers are running
docker-compose ps

# Test Team 1 API
curl http://localhost:8001/health

# Test Team 2 API
curl http://localhost:8002/health

# Test Redis
docker-compose exec redis redis-cli ping

# Test MySQL
docker-compose exec mysql mysql -u abs_user -p agent_browser

# Test VectorDB
curl http://localhost:6333/health
```

---

##  Project Structure

```
agent-browser/
├── docker-compose.yml          # Main orchestration file
├── .env.example                # Environment template
├── .env                        # Your secrets (DO NOT COMMIT)
├── README.md                   # This file
│
├── team1-mcp-playwright/       # Team 1 workspace
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── src/
│   │   ├── main.py            # FastAPI app
│   │   ├── grounding/         # Vision, text, heuristic modules
│   │   ├── router/            # Confidence-based routing
│   │   └── utils/
│   └── tests/
│
├── team2-infra/                # Team 2 workspace
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── src/
│   │   ├── main.py            # FastAPI app
│   │   ├── workflows/         # Workflow storage & retrieval
│   │   ├── evaluation/        # Metrics framework
│   │   ├── pii/               # PII filtering
│   │   └── utils/
│   ├── db/
│   │   ├── init/              # SQL initialization scripts
│   │   └── migrations/        # Alembic migrations
│   └── tests/
│
├── shared/                     # Shared volumes
   ├── screenshots/           # Browser screenshots
   ├── recordings/            # Session recordings
   ├── workflows/             # Saved workflows
   └── evaluation/            # Evaluation results

```

---

##  Team Workflows

### Team 1: MCP-Playwright Development

```bash
# Start only your service + dependencies
docker-compose up -d redis mysql vectordb mcp-playwright

# View your logs
docker-compose logs -f mcp-playwright

# Rebuild after code changes
docker-compose build mcp-playwright
docker-compose up -d mcp-playwright

# Run tests
docker-compose run mcp-playwright pytest

# Access container shell
docker-compose exec mcp-playwright bash

# Install new dependency (see instructions below)
```

### Team 2: Infrastructure Development

```bash
# Start only your service + dependencies
docker-compose up -d redis mysql vectordb infra-service

# View your logs
docker-compose logs -f infra-service

# Rebuild after code changes
docker-compose build infra-service
docker-compose up -d infra-service

# Run tests
docker-compose run infra-service pytest

# Database migrations
docker-compose run infra-service alembic revision --autogenerate -m "add new table"
docker-compose run infra-service alembic upgrade head

# Access container shell
docker-compose exec infra-service bash
```

---

##  Adding New Dependencies

### For Team 1 (MCP-Playwright)

1. **Edit** `team1-mcp-playwright/requirements.txt`:
   ```txt
   # Add your package with specific version
   new-package==1.2.3
   ```

2. **Rebuild** the container:
   ```bash
   docker-compose build mcp-playwright
   ```

3. **Test** the changes:
   ```bash
   docker-compose up -d mcp-playwright
   docker-compose run mcp-playwright pytest
   ```

4. **Commit** both files:
   ```bash
   git add team1-mcp-playwright/requirements.txt
   git add team1-mcp-playwright/src/your-new-code.py
   git commit -m "feat: add new-package for feature X"
   git push
   ```

5. **Notify** the team in your communication channel

### For Team 2 (Infrastructure)

Same process, but use `team2-infra/requirements.txt` and `infra-service` container name.

###  Important Rules

- **Always pin versions**: Use `==` not `>=`
- **Test before committing**: Run `pytest` in container
- **Document why**: Add comment explaining the dependency
- **Check security**: Run `pip-audit` periodically
- **Coordinate**: Notify team before adding heavy dependencies

---

##  Service Integration

Teams work independently but can integrate via:

### 1. **Shared Database (MySQL)**
```python
# Both teams can access same tables
from sqlalchemy import create_engine

engine = create_engine(
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DATABASE}"
)
```

### 2. **Shared Vector DB (Qdrant)**
```python
# Store and retrieve workflow embeddings
from qdrant_client import QdrantClient

client = QdrantClient(host=VECTOR_DB_HOST, port=VECTOR_DB_PORT)
```

### 3. **Shared Redis Cache**
```python
# Share state and messages
import redis

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
```

### 4. **HTTP APIs**
```python
# Team 1 can call Team 2 and vice versa
import httpx

# From Team 1 to Team 2
response = await httpx.get("http://infra-service:8000/workflows/123")

# From Team 2 to Team 1
response = await httpx.post("http://mcp-playwright:8000/ground", json={...})
```

---

##  Monitoring & Debugging

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mcp-playwright
docker-compose logs -f infra-service
docker-compose logs -f mysql

# Last 100 lines
docker-compose logs --tail=100 mcp-playwright
```

### Access Databases
```bash
# MySQL
docker-compose exec mysql mysql -u abs_user -p
# Password from .env MYSQL_PASSWORD

# Redis
docker-compose exec redis redis-cli
> PING
> KEYS *
> GET some-key

# VectorDB UI
# Open browser: http://localhost:6333/dashboard
```

### Container Shell Access
```bash
# Team 1
docker-compose exec mcp-playwright bash

# Team 2
docker-compose exec infra-service bash

# MySQL
docker-compose exec mysql bash
```

---

##  Testing

### Run Tests for Your Team
```bash
# Team 1
docker-compose run mcp-playwright pytest -v

# Team 2
docker-compose run infra-service pytest -v

# With coverage
docker-compose run mcp-playwright pytest --cov=src --cov-report=html

# Specific test file
docker-compose run mcp-playwright pytest tests/test_grounding.py
```

### Integration Tests
```bash
# Test both teams together
docker-compose up -d
docker-compose run mcp-playwright pytest tests/integration/
docker-compose run infra-service pytest tests/integration/
```

---

##  Common Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v

# Rebuild specific service
docker-compose build mcp-playwright

# Rebuild all services
docker-compose build

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a

# View networks
docker network ls

# View volumes
docker volume ls
```

---

##  Security Best Practices

1. **Never commit `.env`** - It's in `.gitignore`
2. **Rotate secrets regularly** - Update `.env` and rebuild
3. **Use strong passwords** - Generate with `openssl rand -base64 32`
4. **Limit exposed ports** - Only expose what you need
5. **Run `pip-audit`** - Check for vulnerable dependencies
6. **Keep images updated** - Rebuild with latest base images

---

##  Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs mcp-playwright

# Check if port is already in use
netstat -ano | findstr :8001  # Windows
lsof -i :8001                 # Mac/Linux

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Database connection errors
```bash
# Verify MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysql -u abs_user -p -e "SHOW DATABASES;"
```

### Out of disk space
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Check disk usage
docker system df
```

### Playwright browser issues
```bash
# Reinstall browsers
docker-compose exec mcp-playwright playwright install chromium
docker-compose exec mcp-playwright playwright install-deps
```


