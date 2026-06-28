from generator import generate_answer
from config import SIM_THRESHOLD
from services.knowledge_service import KnowledgeService
from services.rag_service import RAGService
from services.planner_service import PlannerService
from generator import generate_website_answer,generate_answer

planner = PlannerService()
knowledge = KnowledgeService()
rag = RAGService()

def route(q):

    plan = planner.plan(q)

    if plan["tool"] == "products":
        products = knowledge.search_products(plan["filters"])
        answer = generate_website_answer(q, products)
        return {"answer": answer, "tool": "products","products": products}
    
    elif plan["tool"] == "website":
        page = knowledge.get_page(plan["page"])
        answer = generate_website_answer(q, page)
        return {"answer": answer, "tool": "website"}
    
    elif plan["tool"] == "pdf":
        results = rag.retrieve(q)

        score = f"Retrieved {len(results)} results. Top score: {results[0][3] if results else 'N/A'}"
        if not results or results[0][3] < SIM_THRESHOLD:
            return "I don't know.", {}, "No relevant sources found"

        contexts = []
        sources = []

        for content, source, page, score, *_ in results:
            contexts.append(content)
            sources.append((source, page))

        answer = generate_answer(q, contexts)
        print("Bot:", answer)
        print("\nSources:")
        sources = {source: page for source, page in set(sources)}  # Remove duplicates
        return {"answer": answer, "tool": "pdf","sources": sources,}
    
    elif plan["tool"] == "order" or plan["tool"] == "cart":
        return {"answer": None, "tool": plan["tool"]}