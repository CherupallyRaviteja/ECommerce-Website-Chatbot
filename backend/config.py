import os
import nltk
from sentence_transformers import SentenceTransformer
import dotenv
nltk.download('punkt', quiet=True)
import google.generativeai as genai
import os
dotenv.load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODEL = genai.GenerativeModel("gemini-2.5-flash")
EMBED_MODEL = 'all-MiniLM-L6-v2'
EMBED_DIM = 384
SIM_THRESHOLD = 0.3
FAISS_TOP_K = 4
SENT_SIM_THRESHOLD = 0.7

DATABASE_URL = os.getenv("DATABASE_URL")

POPPLER_BIN = r"C:\poppler\Library\bin"
if POPPLER_BIN not in os.environ["PATH"]:
    os.environ["PATH"] = POPPLER_BIN + os.pathsep + os.environ["PATH"]

embed_model = None

def get_embed_model():
    global embed_model

    if embed_model is None:
        print("Loading embedding model...")
        embed_model = SentenceTransformer(EMBED_MODEL)

    return embed_model

if __name__ == "__main__":
    print("✅ Config loaded")
    print("Model:", MODEL)
    print("Embedding dim:", EMBED_DIM)
