# Start Both Backend and Frontend Services
Write-Host "Starting Home & Own Application Services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend in a new window
Write-Host "Starting Backend API Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\python_api'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend in a new window
Write-Host "Starting Frontend Dev Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "Both services are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Frontend App: http://localhost:8082" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window (services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

