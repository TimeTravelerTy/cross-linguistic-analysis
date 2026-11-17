"""Start the API with auto-reload. Works from any working directory."""
import os
import sys
from pathlib import Path

import uvicorn

BACKEND_DIR = Path(__file__).resolve().parent

if __name__ == "__main__":
    sys.path.insert(0, str(BACKEND_DIR))
    os.chdir(BACKEND_DIR)
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
        reload_dirs=[str(BACKEND_DIR / "app")],
    )
