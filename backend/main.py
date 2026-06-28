from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from controller import route
from fastapi import UploadFile, File
from services.rag_service import RAGService

rag = RAGService()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    cart: list = []
    orders: list = []

@app.get("/")
def read_root():
    return {"message": "Welcome to the E-Commerce Chatbot API!"}

@app.post("/chat")
def chat(request: ChatRequest):

    result = route(
        request.query
    )
    return result

import os
import shutil

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/upload-pdf")
def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = rag.add_pdf(file_path)
    if result:
        return {"answer": f"{file.filename} uploaded successfully. You can now ask questions about this document.","tool": "website"}
    return {"answer": "Failed to process the PDF. Please try again.","tool": "website"}
