@echo off
echo 🚀 LocalPerks Quick Production Deploy
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Not in LocalPerks_WEB directory
    echo Please run this script from the LocalPerks_WEB folder
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Run deployment check
echo 🔍 Running deployment readiness check...
node deploy-production.js

echo.
echo 📋 Pre-deployment checklist:
echo 1. ✅ Environment variables set in Vercel dashboard
echo 2. ✅ Mobile app API URL updated
echo 3. ✅ Database connection tested
echo.

set /p deploy="Are you ready to deploy? (y/N): "

if /i "%deploy%"=="y" (
    echo 🚀 Deploying to production...
    vercel --prod
    
    echo.
    echo 🎉 Deployment complete!
    echo.
    echo 📋 Next steps:
    echo 1. Update mobile app API URL with your Vercel URL
    echo 2. Test your deployed app
    echo 3. Update LocalPerks_APP\src\config\api.ts
    echo.
    echo 📱 Mobile app update:
    echo Edit: LocalPerks_APP\src\config\api.ts
    echo Replace: https://YOUR-VERCEL-APP-NAME.vercel.app/api
    echo With: [Your actual Vercel URL]/api
) else (
    echo ❌ Deployment cancelled
    echo.
    echo 🔧 Complete the checklist above and run this script again
)

pause

