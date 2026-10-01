# Docker configuration for ExamSetu AI backend.
# Single image used for both API and worker.

FROM python:3.12-slim

# System dependencies for OpenCV, Tesseract, and PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv

# Copy dependency files first for layer caching
COPY pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy application code
COPY . .

# Default: run the API server
ENV PORT=8000
EXPOSE ${PORT}

# API command (override with worker command for background worker)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]

# Worker command (used in Render Background Worker):
# CMD ["arq", "app.workers.settings.WorkerSettings"]
