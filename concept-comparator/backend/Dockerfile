FROM python:3.11.2-slim

WORKDIR /app

# Install system dependencies including wget
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create data directory
RUN mkdir -p data/clics

# Download files from Google Drive (all in one RUN command)
RUN wget --quiet --save-cookies cookies.txt --keep-session-cookies --no-check-certificate \
    "https://docs.google.com/uc?export=download&id=1aBUaQO2uF8PbU3BdT0vpmzc4iB2iFR6t" -O- | \
    sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p' > confirm.txt && \
    wget --quiet --load-cookies cookies.txt \
    "https://docs.google.com/uc?export=download&confirm=$(cat confirm.txt)&id=1aBUaQO2uF8PbU3BdT0vpmzc4iB2iFR6t" \
    -O data/clics/clics.sqlite && \
    rm -f cookies.txt confirm.txt && \
    wget --quiet --save-cookies cookies.txt --keep-session-cookies --no-check-certificate \
    "https://docs.google.com/uc?export=download&id=1cXl8fALsCoidFbfbQO7OTILpveN_m4bt" -O- | \
    sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1\n/p' > confirm.txt && \
    wget --quiet --load-cookies cookies.txt \
    "https://docs.google.com/uc?export=download&confirm=$(cat confirm.txt)&id=1cXl8fALsCoidFbfbQO7OTILpveN_m4bt" \
    -O data/clics/network-3-families.gml && \
    rm -f cookies.txt confirm.txt

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('wordnet')"

# Copy the app code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]