#!/bin/bash

echo "🔨 Building AUTON® for production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

# Build frontend
echo "🎨 Building frontend..."
npm run build

# Copy static files
echo "📁 Preparing static files..."
mkdir -p dist/public
cp -r dist/client/* dist/public/ 2>/dev/null || true

# Set production environment
echo "⚙️ Setting production environment..."
export NODE_ENV=production

echo "✅ Build completed successfully!"
echo "🚀 Ready for deployment on Hostinger"
echo ""
echo "Commands to run on server:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"