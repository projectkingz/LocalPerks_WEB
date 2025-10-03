#!/bin/bash

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Build the application
echo "Building the application..."
npm run build

# Deploy database migrations
echo "Deploying database migrations..."
npx prisma migrate deploy

# Seed the database if needed (comment out if you don't want to seed in production)
# echo "Seeding the database..."
# npx prisma db seed

echo "Deployment preparation complete!" 