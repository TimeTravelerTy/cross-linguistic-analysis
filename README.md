# Cross-Linguistic Concept Comparator

A tool for analyzing how different languages encode semantic relationships between concepts, combining computational and genealogical/areal approaches.

## Features

- Word sense disambiguation through WordNet and CLICS
- Cross-linguistic semantic similarity analysis using LaBSE embeddings
- Colexification pattern analysis across language families
- Interactive visualizations of semantic relationships
- Support for 90 languages across multiple families
- Family and areal pattern analysis
- Semantic chain discovery - reveals indirect semantic connections through colexification links in a family (e.g., WEATHER→SKY→GOD)
- Correlation analysis between computational and genealogical measures

## Prerequisites

- Python 3.8-3.11.x
- Node.js 16+
- NLTK with WordNet
- OpenAI API key (for translations)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/TimeTravelerTy/cross-linguistic-analysis.git
cd cross-linguistic-analysis/concept-comparator
```

### 2. Download CLICS Data

Download the required CLICS data files from the release of this repository:
- `clics.sqlite`
- `network-3-families.gml`

Place these files in the `data/clics` subdirectory of the backend directory of your project.

### 3. Backend Setup

Create and activate a Python virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Set up environment variables:
```bash
# Create .env file in the root directory
touch .env

# Add the following variables
OPENAI_API_KEY=your_openai_api_key
CLICS_NETWORK_PATH=backend/data/clics/network-3-families.gml
```

Download required NLTK data:
```python
python -c "import nltk; nltk.download('wordnet')"
```

### 4. Frontend Setup

Install Node.js dependencies:

```bash
cd frontend
npm install
```

### 5. Running the Application

1. Start the backend server:
```bash
# From the root directory
python backend/run.py
```

2. Start the frontend development server:
```bash
# From the frontend directory
npm run dev
```

The application should now be running at `http://localhost:5173`

## Key Components

### Backend Services

- `DisambiguationService`: Handles word sense disambiguation using WordNet/CLICS
- `TranslationService`: Manages translations using GPT-4o-mini
- `EmbeddingService`: Computes embedding similarities using LaBSE
- `ClicsService`: Analyzes colexification patterns

### Frontend Components

- Word sense selection
- Language family/subfamily selection
- Semantic space visualization
- Family-level colexification graphs  
- Family pattern analysis
- Statistical correlation analysis

## Usage

1. Enter two concepts to compare
2. Select word senses (WordNet) or concepts (CLICS)
3. Choose target languages for comparison
4. View results including:
   - Semantic similarities
   - Colexification patterns
   - Family-level analysis
   - Areal patterns
   - Statistical correlations between embedding and colexification similarities

## Common Issues and Solutions

1. **CLICS Data Loading Error**
   - Ensure the GML file path in `.env` is correct

2. **Translation Service Error**
   - Verify OpenAI API key is set correctly
   - Check API rate limits

3. **Embedding Service Issues**
   - First run may take longer as it downloads the LaBSE model
   - Ensure enough RAM (at least 8GB recommended)

## Contributing

Contributions are welcome! Please read through the existing issues before submitting new ones.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
