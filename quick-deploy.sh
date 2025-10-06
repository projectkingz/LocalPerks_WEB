#!/bin/bash

# 🚀 LocalPerks Quick Production Deploy Script

echo "🚀 Starting LocalPerks Production Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in LocalPerks_WEB directory"
    echo "Please run this script from the LocalPerks_WEB folder"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Run deployment check
echo "🔍 Running deployment readiness check..."
node deploy-production.js

echo ""
echo "📋 Pre-deployment checklist:"
echo "1. ✅ Environment variables set in Vercel dashboard"
echo "2. ✅ Mobile app API URL updated"
echo "3. ✅ Database connection tested"
echo ""

read -p "Are you ready to deploy? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    vercel --prod
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update mobile app API URL with your Vercel URL"
    echo "2. Test your deployed app"
    echo "3. Update LocalPerks_APP/src/config/api.ts"
    echo ""
    echo "📱 Mobile app update:"
    echo "Edit: LocalPerks_APP/src/config/api.ts"
    echo "Replace: https://YOUR-VERCEL-APP-NAME.vercel.app/api"
    echo "With: [Your actual Vercel URL]/api"
else
    echo "❌ Deployment cancelled"
    echo ""
    echo "🔧 Complete the checklist above and run this script again"
fi
