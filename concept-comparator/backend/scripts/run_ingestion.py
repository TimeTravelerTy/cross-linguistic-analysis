"""
Master ingestion runner. Executes all ingestion steps in order.

Usage:
    cd backend
    python scripts/run_ingestion.py [--skip-omw] [--skip-embeddings]

Steps:
    1. setup_database    — create atlas.sqlite tables
    2. ingest_concepticon — fetch Concepticon 3.4.0
    3. link_clics        — map CLICS GML glosses → Concepticon IDs
    4. ingest_omw        — fetch OMW lexical anchors (optional, --skip-omw)
    5. compute_embeddings — Node2Vec on CLICS graph (optional, --skip-embeddings)
"""
import argparse
import sys
import time
from pathlib import Path

# Ensure scripts/ is importable
sys.path.insert(0, str(Path(__file__).parent))

import setup_database
import ingest_concepticon
import link_clics_concepticon
import ingest_omw
import compute_colex_embeddings


def step(name: str, fn):
    print(f"\n{'='*60}")
    print(f"  STEP: {name}")
    print(f"{'='*60}")
    t0 = time.time()
    fn()
    print(f"  Done in {time.time()-t0:.1f}s")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run all atlas ingestion steps")
    parser.add_argument("--skip-omw", action="store_true", help="Skip OMW ingestion")
    parser.add_argument("--skip-embeddings", action="store_true", help="Skip Node2Vec embeddings")
    args = parser.parse_args()

    step("Create database tables", setup_database.main)
    step("Ingest Concepticon 3.4.0", ingest_concepticon.main)
    step("Link CLICS → Concepticon", link_clics_concepticon.main)

    if not args.skip_omw:
        step("Ingest OMW anchors", ingest_omw.main)
    else:
        print("\nSkipping OMW ingestion (--skip-omw)")

    if not args.skip_embeddings:
        step("Compute Node2Vec embeddings", compute_colex_embeddings.main)
    else:
        print("\nSkipping Node2Vec embeddings (--skip-embeddings)")

    print("\n" + "="*60)
    print("  ALL STEPS COMPLETE")
    print("="*60)


if __name__ == "__main__":
    main()
