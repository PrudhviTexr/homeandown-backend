# Start Backend FastAPI Server
Write-Host "Starting Backend API Server on http://127.0.0.1:8000" -ForegroundColor Green
cd python_api
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

