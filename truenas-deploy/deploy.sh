#!/bin/bash
# Budget App - TrueNAS Deployment Script
# Run this from the truenas-deploy directory

set -e

echo "======================================"
echo "Budget App - TrueNAS Deploy Script"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and edit it first."
    exit 1
fi

# Check if frontend dist exists
if [ ! -d "../frontend/dist" ]; then
    echo "ERROR: Frontend build not found!"
    echo "Run 'cd ../frontend && npm run build' first."
    exit 1
fi

# Create required directories
mkdir -p postgres_data staticfiles media

echo ""
echo "Building and starting containers..."
docker-compose down 2>/dev/null || true
docker-compose build --no-cache backend
docker-compose up -d

echo ""
echo "Waiting for database to be ready..."
sleep 10

echo ""
echo "Running migrations..."
docker-compose exec backend python manage.py migrate --noinput

echo ""
echo "Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

echo ""
echo "Seeding default data..."
docker-compose exec backend python manage.py seed_defaults --email=${ADMIN_EMAIL:-admin@example.com} || true

echo ""
echo "======================================"
echo "Deployment complete!"
echo "======================================"
echo ""
echo "Access your app at:"
echo "  http://YOUR-TRUENAS-IP:8080"
echo ""
echo "To check logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop:"
echo "  docker-compose down"
echo ""
