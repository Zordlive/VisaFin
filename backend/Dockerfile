# Backend Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Create necessary directories
RUN mkdir -p staticfiles

# Collect static files (ignore errors if migrations haven't run yet)
RUN python manage.py collectstatic --noinput --clear 2>/dev/null || true

EXPOSE 8000

# Start with migrations and gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 60 invest_backend.wsgi:application"]
