from importlib.resources import path
import os
import psycopg2
from config import DATABASE_URL, embed_model
from db_init import init_database
from document_loader import load_pdf

class RAGService:
    def __init__(self):
        init_database()
        self.conn = psycopg2.connect(DATABASE_URL)
        self.cur = self.conn.cursor()

    def add_pdf(self, path):
        try:
            documents = load_pdf(path)
            filename = os.path.basename(path)
            self.cur.execute(
                """
                INSERT INTO uploaded_pdfs (
                    filename,
                    total_pages,
                    total_chunks
                )
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (
                    filename,
                    max(doc["page"] for doc in documents),
                    len(documents)
                )
            )

            pdf_id = self.cur.fetchone()[0]
            for item in documents:
                vec = ",".join(map(str, item["embedding"].tolist()))
                self.cur.execute(
                    """
                    INSERT INTO documents (pdf_id,page,content,embedding,tsv)
                    VALUES (%s,%s,%s,%s::vector,to_tsvector('english', %s))
                    """,
                    (
                        pdf_id,
                        item["page"],
                        item["content"],
                        f"[{vec}]",
                        item["content"]
                    )
                )
                self.conn.commit()
            print("PDF ADDED ✅")
            return True

        except Exception as e:
            self.conn.rollback()
            raise e

    def retrieve(self, query, top_k=5):
        qv = embed_model.encode([query], convert_to_numpy=True)[0]
        vec = ",".join(map(str, qv.tolist()))

        self.cur.execute("""
        SELECT
            d.content,
            p.filename,
            d.page,
            1 - (d.embedding <=> %s::vector) AS vec_score,
            ts_rank(d.tsv, plainto_tsquery(%s)) AS text_score
        FROM documents d
        JOIN uploaded_pdfs p
            ON d.pdf_id = p.id
        WHERE
            d.tsv @@ plainto_tsquery(%s)
            OR d.embedding <=> %s::vector < 0.8
        ORDER BY
            (
                0.6 * (1 - (d.embedding <=> %s::vector)) +
                0.4 * ts_rank(d.tsv, plainto_tsquery(%s))
            ) DESC
        LIMIT %s
        """,
        (
            f"[{vec}]",
            query,
            query,
            f"[{vec}]",
            f"[{vec}]",
            query,
            top_k
        ))

        return self.cur.fetchall()
    
    def get_documents(self):
        self.cur.execute("""
            SELECT DISTINCT source
            FROM documents
            ORDER BY source
        """)

        rows = self.cur.fetchall()

        documents = []

        for row in rows:

            documents.append({
                "name": row[0]
            })

        return documents
    
    def delete_document(self, doc_name):
        self.cur.execute("""
            DELETE FROM documents
            WHERE source = %s
        """, (doc_name,))

        self.conn.commit()
        print(f"{doc_name} deleted ✅")


"""
def retrieve(self, query, top_k=4):
        qv = embed_model.encode([query], convert_to_numpy=True)[0]
        vec = ",".join(map(str, qv.tolist()))
        self.cur.execute(""
            SELECT content, source, page, 1-(embedding <=> %s::vector)
            FROM documents
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            "", (f"[{vec}]", f"[{vec}]", top_k))
        return self.cur.fetchall()
"""
    

if __name__ == "__main__":
    print("✅ RAG service ready")
