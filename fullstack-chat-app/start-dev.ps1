# Development Setup Script for Full Stack Chat App
# This script starts both the backend and frontend in development mode

Write-Host "Starting Full Stack Chat App in Development Mode..." -ForegroundColor Green

# Start backend in development mode
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start frontend in development mode
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Servers started successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5001" -ForegroundColor Cyan