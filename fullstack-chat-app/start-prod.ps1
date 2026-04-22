# Production Setup Script for Full Stack Chat App
# This script builds the frontend and starts the backend server in production mode

Write-Host "Building and Starting Full Stack Chat App in Production Mode..." -ForegroundColor Green

# Build the frontend
Write-Host "Building Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

# Start backend in production mode (serves the frontend)
Write-Host "Starting Backend Server in Production Mode..." -ForegroundColor Yellow
Set-Location backend
npm start