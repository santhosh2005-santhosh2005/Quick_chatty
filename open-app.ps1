# Script to open the chat application in default browser
Write-Host "Opening Chat Application..." -ForegroundColor Green

# Wait a moment for servers to fully start
Start-Sleep -Seconds 3

# Test if servers are responding
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend server is running" -ForegroundColor Green
    
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5003/api/auth/check" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend server is running" -ForegroundColor Green
    
    # Open URLs in default browser
    Write-Host "Opening application in your default browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:5173"
    
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Backend API: http://localhost:5003" -ForegroundColor Cyan
    Write-Host "If the browser doesn't open automatically, please copy and paste the URLs above into your browser." -ForegroundColor Yellow
}
catch {
    Write-Host "❌ Error: Could not connect to one or both servers" -ForegroundColor Red
    Write-Host "Please make sure both servers are running:" -ForegroundColor Yellow
    Write-Host "1. Backend: cd fullstack-chat-app/backend && npm run dev" -ForegroundColor Yellow
    Write-Host "2. Frontend: cd fullstack-chat-app/frontend && npm run dev" -ForegroundColor Yellow
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}