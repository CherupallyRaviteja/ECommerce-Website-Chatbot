import os
import fitz
from config import get_embed_model
from chunking import watson_chunking

def pdf_to_text(pdf_path):
    doc = fitz.open(pdf_path)
    pages = []

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text()

        if text.strip():
            pages.append((page_num, text))

    return pages

def load_pdf(file_path):
    
    if not file_path.lower().endswith(".pdf"):
        raise ValueError("Only PDF files are supported.")
    pages = pdf_to_text(file_path)

    documents = []

    for page_num, page_text in pages:

        chunks = watson_chunking(page_text)

        embed_model = get_embed_model()
        vectors = embed_model.encode(
            chunks,
            convert_to_numpy=True
        )

        for chunk, vector in zip(chunks, vectors):

            documents.append({
                "source": os.path.basename(file_path),
                "page": page_num,
                "content": chunk,
                "embedding": vector
            })

    return documents

