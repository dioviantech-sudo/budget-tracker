#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Building Budget Tracker ==="

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if not exists (optional)
echo "Setup complete!"
