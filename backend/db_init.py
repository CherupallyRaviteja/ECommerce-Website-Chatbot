import psycopg2
from config import DATABASE_URL, EMBED_DIM

def init_database():

    # connect to project DB
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # enable pgvector
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # create table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS uploaded_pdfs (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_pages INTEGER,
        total_chunks INTEGER
    )
    """)
    
    cur.execute(f"""
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        pdf_id INTEGER NOT NULL REFERENCES uploaded_pdfs(id) ON DELETE CASCADE,
        page INTEGER,
        content TEXT,
        embedding VECTOR({EMBED_DIM}),
        tsv tsvector
    )
    """)

    # index for vector search
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_embedding
        ON documents
        USING ivfflat (embedding vector_cosine_ops)
    """)

    # index for keyword search
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_tsv
        ON documents
        USING GIN (tsv)
    """)

    conn.commit()
    cur.close()
    conn.close()
    
if __name__ == "__main__":
    init_database()
    print("✅ Database initialized")
