# Makefile for Agent Browser Service
# Convenience commands for Docker operations

.PHONY: help setup start stop restart logs build test clean

# Default target
help:
	@echo "Agent Browser Service - Docker Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial setup (copy .env, create directories)"
	@echo ""
	@echo "Service Management:"
	@echo "  make start          - Start all services (frontend, backend, databases)"
	@echo "  make stop           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View all logs"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-start - Start frontend only"
	@echo "  make frontend-logs  - View frontend logs"
	@echo "  make frontend-build - Rebuild frontend"
	@echo ""
	@echo "Team 1 (MCP-Playwright):"
	@echo "  make team1-start    - Start Team 1 services"
	@echo "  make team1-logs     - View Team 1 logs"
	@echo "  make team1-build    - Rebuild Team 1 service"
	@echo "  make team1-test     - Run Team 1 tests"
	@echo "  make team1-shell    - Access Team 1 container shell"
	@echo ""
	@echo "Team 2 (Infrastructure):"
	@echo "  make team2-start    - Start Team 2 services"
	@echo "  make team2-logs     - View Team 2 logs"
	@echo "  make team2-build    - Rebuild Team 2 service"
	@echo "  make team2-test     - Run Team 2 tests"
	@echo "  make team2-shell    - Access Team 2 container shell"
	@echo "  make team2-db       - Access MySQL shell"
	@echo ""
	@echo "Development:"
	@echo "  make build          - Rebuild all services"
	@echo "  make test           - Run all tests"
	@echo "  make dev            - Start in development mode (with logs)"
	@echo "  make clean          - Stop and remove all containers/volumes"
	@echo "  make status         - Show service status"

# Setup
setup:
	@echo "Setting up Agent Browser Service..."
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env file - please edit it with your credentials"; fi
	@mkdir -p shared/screenshots shared/recordings shared/workflows shared/evaluation
	@echo "Setup complete!"

# Service Management
start:
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   MCP-Playwright API: http://localhost:8001"
	@echo "   Infrastructure API: http://localhost:8000"
	@echo ""

stop:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

status:
	docker-compose ps

dev:
	docker-compose up

# Frontend
frontend-start:
	docker-compose up -d frontend

frontend-logs:
	docker-compose logs -f frontend

frontend-build:
	docker-compose build frontend

# Team 1: MCP-Playwright
team1-start:
	docker-compose up -d redis mysql vectordb mcp-playwright

team1-logs:
	docker-compose logs -f mcp-playwright

team1-build:
	docker-compose build mcp-playwright

team1-test:
	docker-compose run --rm mcp-playwright pytest -v

team1-shell:
	docker-compose exec mcp-playwright bash

# Team 2: Infrastructure
team2-start:
	docker-compose up -d redis mysql vectordb infra-service

team2-logs:
	docker-compose logs -f infra-service

team2-build:
	docker-compose build infra-service

team2-test:
	docker-compose run --rm infra-service pytest -v

team2-shell:
	docker-compose exec infra-service bash

team2-db:
	docker-compose exec mysql mysql -u abs_user -p agent_browser

# Build
build:
	docker-compose build

# Test
test:
	@echo "Running Team 1 tests..."
	docker-compose run --rm mcp-playwright pytest -v
	@echo ""
	@echo "Running Team 2 tests..."
	docker-compose run --rm infra-service pytest -v

# Clean
clean:
	@echo "WARNING: This will remove all containers and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "Cleanup complete!"; \
	fi
