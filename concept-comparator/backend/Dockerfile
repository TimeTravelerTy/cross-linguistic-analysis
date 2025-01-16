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

# Download files from Google Drive
RUN curl -L "https://drive.google.com/uc?export=download&id=1aBUaQO2uF8PbU3BdT0vpmzc4iB2iFR6t" -o data/clics/clics.sqlite
RUN curl -L "https://drive.google.com/uc?export=download&id=1cXl8fALsCoidFbfbQO7OTILpveN_m4bt" -o data/clics/network-3-families.gml

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('wordnet')"

# Copy the app code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]