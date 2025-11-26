# PowerShell script to clear .next folder and stop Node processes
# Run this if you encounter file locking errors

Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Clearing .next folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ .next folder deleted" -ForegroundColor Green
} else {
    Write-Host "✓ .next folder not found" -ForegroundColor Green
}

Write-Host "`nDone! You can now run 'npm run dev' again." -ForegroundColor Green

