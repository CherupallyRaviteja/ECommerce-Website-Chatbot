import os
import psutil
from sentence_transformers import SentenceTransformer

process = psutil.Process(os.getpid())

print(f"Before loading: {process.memory_info().rss / 1024 / 1024:.2f} MB")

model = SentenceTransformer("all-MiniLM-L6-v2")

print(f"After loading: {process.memory_info().rss / 1024 / 1024:.2f} MB")

input("Press Enter to exit...")