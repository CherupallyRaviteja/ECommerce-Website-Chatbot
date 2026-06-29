import os
import dotenv
import nltk
from google import genai as new_genai
from google.genai import types
import google.generativeai as old_genai
dotenv.load_dotenv()
nltk.download("punkt", quiet=True)

old_genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL = old_genai.GenerativeModel("gemini-2.5-flash")

client = new_genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

EMBED_DIM = 768
SIM_THRESHOLD = 0.3
FAISS_TOP_K = 4
SENT_SIM_THRESHOLD = 0.7

DATABASE_URL = os.getenv("DATABASE_URL")

POPPLER_BIN = r"C:\poppler\Library\bin"
if POPPLER_BIN not in os.environ["PATH"]:
    os.environ["PATH"] = POPPLER_BIN + os.pathsep + os.environ["PATH"]


def get_embedding(text):
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=EMBED_DIM,
        ),
    )
    return response.embeddings[0].values


if __name__ == "__main__":
    print("✅ Config loaded")
    print("Model:", MODEL)
    print("Embedding dim:", EMBED_DIM)