#!/bin/bash
# Script to switch between local and production databases
# Usage: ./scripts/switch-database.sh [local|production]

ENV_TYPE=${1:-local}

if [ "$ENV_TYPE" = "local" ]; then
    echo "🔄 Switching to LOCAL database..."
    
    if [ -f .env.local ]; then
        cp .env.local .env
        echo "✅ Using .env.local"
    else
        echo "⚠️  .env.local not found. Creating template..."
        echo "DATABASE_URL=\"mysql://user:password@localhost:3306/localperks\"" > .env.local
        echo "✅ Created .env.local template. Please update with your local database URL."
    fi
    
    echo "📊 Generating Prisma Client for local..."
    npx prisma generate
    
elif [ "$ENV_TYPE" = "production" ]; then
    echo "🔄 Switching to PRODUCTION database..."
    
    if [ -f .env.production ]; then
        cp .env.production .env
        echo "✅ Using .env.production"
    else
        echo "⚠️  .env.production not found."
        echo "💡 Using Vercel environment variables or .env"
    fi
    
    echo "📊 Generating Prisma Client with Accelerate..."
    npx prisma generate --accelerate
    
else
    echo "❌ Invalid option: $ENV_TYPE"
    echo "Usage: ./scripts/switch-database.sh [local|production]"
    exit 1
fi

echo "✅ Database switched to: $ENV_TYPE"






