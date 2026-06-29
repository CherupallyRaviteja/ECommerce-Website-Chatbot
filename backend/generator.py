import numpy as np
from config import MODEL, get_embed_model
import json
def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def generate_answer(query, contexts, scores=None, sim_threshold=0.35):
    """RAG answer generator that forbids pretrained knowledge."""

    # 1️⃣ Reject if no retrieved context
    if not contexts or len(contexts) == 0:
        return "I don't know."

    # 2️⃣ Reject if top retrieval score is too low
    if scores is not None and len(scores) > 0 and scores[0] < 0.25:
        return "I don't know."

    # 3️⃣ Join context
    context_text = "\n\n".join(contexts)

    # 4️⃣ Strict prompt (forbids pretraining usage)
    prompt = (
        "You are a retrieval-augmented assistant.\n"
        "Answer ONLY using the information in the context below.\n"
        "If the context does not contain the answer, reply exactly with:\n"
        "\"The provided documents do not contain this information\"\n\n"
        "You are strictly forbidden from using any pretrained or external knowledge.\n"
        "Never add facts, definitions, or reasoning not found verbatim in the context.\n"
        "Answer briefly.\n\n"
        f"Context:\n{context_text}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )

    # 5️⃣ Prepare body with temperature=0 (no creative recall)
    try:
        resp = MODEL.generate_content(prompt)
        answer = resp.text.strip()

        if not answer or "i don't know" in answer.lower():
            return "I don't know."

        # 6️⃣ Post-generation validation: check similarity between context & answer
        embed_model = get_embed_model()
        ans_vec = embed_model.encode(answer, convert_to_numpy=True)
        ctx_vec = embed_model.encode(context_text, convert_to_numpy=True)
        sim = cosine_sim(ans_vec, ctx_vec)

        # 7️⃣ Block if the answer doesn’t semantically match context
        if sim < sim_threshold:
            print(f"⚠️ Context–answer similarity too low ({sim:.2f}), discarding.")
            return "I don't know."

        return answer

    except Exception as e:
        print("⚠️ Connection failed:", e)
        return "I don't know."

def generate_website_answer(query, context):
    """
    Generates answers for products, website pages,
    cart, orders, etc.
    """

    # No context
    if not context:
        return "I don't know."

    # Convert Python object to readable JSON
    if isinstance(context, (dict, list)):
        context = json.dumps(context, indent=2)

    prompt = f"""
    You are ShopMart's AI shopping assistant.

    Your job is to answer the customer's question ONLY using the provided context.

    Rules:
    - Use ONLY the information in the context.
    - Do NOT invent products, prices, stock, policies or order details.
    - If the context does not contain the answer, reply exactly:
    "I don't know."
    - Be concise and friendly.
    - When multiple products are available, recommend the most relevant ones.
    - Mention prices and stock only if available in the context.
    - Do not mention JSON or the provided context.

    Customer Question:
    {query}

    Context:
    {context}

    Answer:
    """

    try:
        response = MODEL.generate_content(prompt)

        answer = response.text.strip()

        if not answer:
            return "I don't know."

        return answer

    except Exception as e:
        print("Generation Error:", e)
        return "I don't know."

if __name__ == "__main__":
    print("🧠 Generator ready")
