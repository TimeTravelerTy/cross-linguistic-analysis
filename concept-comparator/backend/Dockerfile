FROM python:3.11.2-slim

WORKDIR /app

# Install system dependencies including curl
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create data directory
RUN mkdir -p data/clics

# Download files from GitHub releases
RUN curl -L "https://github.com/TimeTravelerTy/cross-linguistic-analysis/releases/download/v1.0.0/clics.sqlite" -o data/clics/clics.sqlite && \
    curl -L "https://github.com/TimeTravelerTy/cross-linguistic-analysis/releases/download/v1.0.0/network-3-families.gml" -o data/clics/network-3-families.gml

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('wordnet')"

# Copy the app code
COPY . .

# Use the PORT environment variable provided by Railway
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]