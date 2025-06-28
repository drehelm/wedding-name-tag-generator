#!/bin/bash

echo "🐳 Starting STL Generator with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop first."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker-compose build

# Start the container
echo "🚀 Starting server..."
docker-compose up -d

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Server is running at http://localhost:3001"
    echo ""
    echo "You can now:"
    echo "1. Open the app in your browser"
    echo "2. Use 'npm run dev' to start the frontend"
    echo "3. Stop with: docker-compose down"
else
    echo "❌ Server failed to start. Check logs with: docker-compose logs"
    exit 1
fi