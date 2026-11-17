.PHONY: help up down test lint build local

help:
	@echo "FeaturePulse — Commands"
	@echo "  make up      : Start the entire system via Docker Compose"
	@echo "  make down    : Stop all containers"
	@echo "  make test    : Run backend unit and integration tests"
	@echo "  make local   : Start local backend server (SQLite)"

up:
	docker compose up --build

down:
	docker compose down -v

test:
	python -m pytest backend/tests

build:
	cd frontend && npm run build

local:
	cd backend && uvicorn app.main:app --reload --port 8000
