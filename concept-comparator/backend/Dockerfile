FROM python:3.11.2-slim

WORKDIR /app

# Install system dependencies including wget (better for large files than curl)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create data directory
RUN mkdir -p data/clics

# Function to download from Google Drive
RUN echo 'download_from_drive() { \
    fileid=$1; \
    filename=$2; \
    wget --quiet --save-cookies cookies.txt --keep-session-cookies --no-check-certificate "https://docs.google.com/uc?export=download&id=$fileid" -O- | \
    sed -rn "s/.*confirm=([0-9A-Za-z_]+).*/\1\n/p" > confirm.txt && \
    wget --quiet --load-cookies cookies.txt "https://docs.google.com/uc?export=download&confirm=$(cat confirm.txt)&id=$fileid" -O $filename && \
    rm -f cookies.txt confirm.txt; \
    }' >> /root/.bashrc && . /root/.bashrc

# Download files from Google Drive
RUN download_from_drive "1aBUaQO2uF8PbU3BdT0vpmzc4iB2iFR6t" "data/clics/clics.sqlite" && \
    download_from_drive "1cXl8fALsCoidFbfbQO7OTILpveN_m4bt" "data/clics/network-3-families.gml"

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('wordnet')"

# Copy the app code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]