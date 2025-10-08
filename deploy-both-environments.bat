@echo off
echo 🚀 LocalPerks - Deploy to Both Environments
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Not in LocalPerks_WEB directory
    echo Please run this script from the LocalPerks_WEB folder
    pause
    exit /b 1
)

echo 📋 Deploying to both Development and Production...
echo.

echo 🔧 Step 1: Deploying to Development (Preview)...
vercel

if errorlevel 1 (
    echo ❌ Development deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Development deployed successfully!
echo.

echo 🔧 Step 2: Deploying to Production...
vercel --prod

if errorlevel 1 (
    echo ❌ Production deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Production deployed successfully!
echo.

echo 🎉 Both environments deployed!
echo.
echo 📋 Deployment Summary:
echo.
echo 🔧 Development: https://localperks-84w2wyfmk-projectkingzs-projects.vercel.app
echo 🚀 Production:  https://localperks-app.vercel.app
echo.

echo ⚠️ IMPORTANT: Set environment variables in Vercel dashboard:
echo 1. Go to: https://vercel.com/projectkingzs-projects/localperks-app
echo 2. Settings → Environment Variables
echo 3. Add required variables for both Preview and Production
echo.

echo 📱 Mobile App Configuration:
echo - Current: Points to Production API
echo - To test Dev API: Edit LocalPerks_APP/src/config/api.ts
echo.

pause



