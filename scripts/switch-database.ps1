# PowerShell script to switch between local and production databases
# Usage: .\scripts\switch-database.ps1 [local|production]

param(
    [Parameter(Position=0)]
    [ValidateSet("local", "production")]
    [string]$EnvType = "local"
)

if ($EnvType -eq "local") {
    Write-Host "🔄 Switching to LOCAL database..." -ForegroundColor Cyan
    
    if (Test-Path ".env.local") {
        Copy-Item ".env.local" ".env" -Force
        Write-Host "✅ Using .env.local" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.local not found. Creating template..." -ForegroundColor Yellow
        @"
# Local Development Database
DATABASE_URL="mysql://user:password@localhost:3306/localperks"

# No Accelerate needed for local
# PRISMA_ACCELERATE_ENDPOINT=

# Local environment
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
"@ | Out-File -FilePath ".env.local" -Encoding utf8
        Write-Host "✅ Created .env.local template. Please update with your local database URL." -ForegroundColor Green
    }
    
    Write-Host "📊 Generating Prisma Client for local..." -ForegroundColor Cyan
    npx prisma generate
    
} elseif ($EnvType -eq "production") {
    Write-Host "🔄 Switching to PRODUCTION database..." -ForegroundColor Cyan
    
    if (Test-Path ".env.production") {
        Copy-Item ".env.production" ".env" -Force
        Write-Host "✅ Using .env.production" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.production not found." -ForegroundColor Yellow
        Write-Host "💡 Using Vercel environment variables or .env" -ForegroundColor Gray
    }
    
    Write-Host "📊 Generating Prisma Client with Accelerate..." -ForegroundColor Cyan
    npx prisma generate --accelerate
}

Write-Host "✅ Database switched to: $EnvType" -ForegroundColor Green






