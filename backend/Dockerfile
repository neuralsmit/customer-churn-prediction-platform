FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Set workspace
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Run model training on build to generate models/seed data file (so it's ready out of the box)
RUN python ml/train.py

# Expose API port
EXPOSE 8000

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
