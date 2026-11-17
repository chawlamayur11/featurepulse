# FeaturePulse Windows PowerShell Launcher
Write-Host "=== Starting FeaturePulse ===" -ForegroundColor Cyan

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Starting via Docker Compose..." -ForegroundColor Green
    docker compose up --build
} else {
    Write-Host "Starting local development mode..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
}
