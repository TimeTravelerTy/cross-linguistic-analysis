"""
Compute colexification-space embeddings for all CLICS concepts using Node2Vec.

Following Rubehn & List (ACL 2025): graph embedding algorithms on the CLICS
colexification network produce linguistically meaningful concept representations.
We use Node2Vec (128-dim) as the primary method; this is available via the
`node2vec` package (pip install node2vec) which wraps gensim Word2Vec.

The embeddings are stored in colex_embeddings, keyed by concepticon_id
(where a Concepticon link exists) or by clics_gloss otherwise.

Run after link_clics_concepticon.py.
Requires: pip install node2vec
"""
import sqlite3
import struct
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "atlas.sqlite"
GML_CANDIDATES = [
    Path(__file__).parent.parent / "data" / "clics" / "network-3-families.gml",
    Path(__file__).parent.parent.parent / "data" / "clics" / "network-3-families.gml",
]

EMBEDDING_DIM = 128
WALK_LENGTH = 30
NUM_WALKS = 10
WORKERS = 4


def find_gml() -> Path:
    for p in GML_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("CLICS GML not found")


def load_graph(gml_path: Path):
    import networkx as nx
    print(f"Loading CLICS graph from {gml_path} …")
    raw = gml_path.read_text(encoding="utf-8")
    cleaned = raw.encode("ascii", "ignore").decode("ascii")
    tmp = gml_path.with_suffix(".tmp")
    tmp.write_text(cleaned)
    try:
        g = nx.read_gml(tmp)
    finally:
        tmp.unlink(missing_ok=True)
    print(f"Graph: {len(g.nodes)} nodes, {len(g.edges)} edges")
    return g


def try_import_node2vec():
    try:
        from node2vec import Node2Vec
        return Node2Vec
    except ImportError:
        print("ERROR: `node2vec` not installed. Run: pip install node2vec")
        return None


def encode_embedding(vec) -> bytes:
    """Encode a list/array of floats as packed float32 bytes."""
    return struct.pack(f"{len(vec)}f", *[float(x) for x in vec])


def decode_embedding(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack(f"{n}f", blob))


def compute_and_store(conn: sqlite3.Connection, g) -> int:
    Node2Vec = try_import_node2vec()
    if Node2Vec is None:
        return 0

    # Build gloss → concepticon_id mapping from DB
    gloss_to_cid = {
        row[0]: row[1]
        for row in conn.execute(
            "SELECT clics_gloss, concepticon_id FROM concept_registry "
            "WHERE clics_gloss IS NOT NULL"
        ).fetchall()
    }

    print(f"Training Node2Vec (dim={EMBEDDING_DIM}, walks={NUM_WALKS}×{WALK_LENGTH}) …")
    import networkx as nx
    # Node2Vec works best on undirected graphs
    ug = g.to_undirected() if g.is_directed() else g

    n2v = Node2Vec(
        ug,
        dimensions=EMBEDDING_DIM,
        walk_length=WALK_LENGTH,
        num_walks=NUM_WALKS,
        workers=WORKERS,
        quiet=False,
    )
    model = n2v.fit(window=10, min_count=1, batch_words=4)
    print("Training complete.")

    records = []
    for node, data in g.nodes(data=True):
        gloss = data.get("Gloss", "").strip()
        if not gloss:
            continue
        node_str = str(node)
        if node_str not in model.wv:
            continue
        vec = model.wv[node_str]
        cid = gloss_to_cid.get(gloss)
        if cid:
            records.append((cid, gloss, encode_embedding(vec)))

    conn.executemany(
        "INSERT OR REPLACE INTO colex_embeddings (concepticon_id, clics_gloss, embedding) "
        "VALUES (?, ?, ?)",
        records,
    )
    conn.execute(
        "INSERT OR REPLACE INTO dataset_versions (name, version, url) "
        "VALUES ('colex_embeddings', 'node2vec-128d', 'computed')"
    )
    conn.commit()
    print(f"Stored {len(records)} embeddings")
    return len(records)


def main() -> None:
    gml_path = find_gml()
    g = load_graph(gml_path)
    with sqlite3.connect(DB_PATH) as conn:
        n = compute_and_store(conn, g)
    print(f"Done: {n} concept embeddings stored")


if __name__ == "__main__":
    main()
