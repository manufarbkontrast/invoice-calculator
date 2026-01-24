#!/bin/bash

# Deployment script for invoice-calculator
# Run this on the production server at /var/www/invoice-calculator

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/invoice-calculator

# Pull latest changes from the branch
echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git checkout stupefied-moser
git pull origin stupefied-moser

# Stop the running container
echo "🛑 Stopping current container..."
docker compose down

# Rebuild the Docker image (no cache to ensure fresh build)
echo "🔨 Building Docker image..."
docker compose build --no-cache

# Start the container
echo "🚀 Starting container..."
docker compose up -d

# Wait a moment for the container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Check container status
echo "📊 Container status:"
docker compose ps

# Show logs
echo "📋 Recent logs:"
docker compose logs --tail=50

echo "✅ Deployment completed!"
echo ""
echo "App is available at: https://invoice.crftn.de"
echo ""
echo "To monitor logs in real-time, run:"
echo "docker compose logs -f"
echo ""
echo "To run database migrations (if needed), run:"
echo "docker compose --profile migrate run --rm invoice-migrate"
