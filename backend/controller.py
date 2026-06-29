from generator import generate_answer
from config import SIM_THRESHOLD
from services.knowledge_service import KnowledgeService
from services.rag_service import RAGService
from services.planner_service import PlannerService
from generator import generate_website_answer,generate_answer

planner = PlannerService()
knowledge = KnowledgeService()

def route(q,rag):
    try:
        plan = planner.plan(q)
    except Exception:
        return {
                    "answer":"The AI Service is temporarily unavailable.",
                    "tool":"website"
                }

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
        if results == None:
           return {
            "answer":"Unable to search the uploaded documents right now.",
            "tool":"pdf"
        }

        score = f"Retrieved {len(results)} results. Top score: {results[0][3] if results else 'N/A'}"
        if not results or results[0][3] < SIM_THRESHOLD:
            return {"answer": "The provided documents do not contain this information", "tool": "pdf"}

        contexts = []
        sources = []

        for content, source, page, score, *_ in results:
            contexts.append(content)
            sources.append((source, page))
        
        try:
            answer = generate_answer(q, contexts)
        except Exception as e:
            print(e)
            return {
                "answer": "I'm unable to generate a response at the moment. Please try again shortly.",
                "tool": "pdf"
            }
        
        print("Bot:", answer)
        print("\nSources:")
        sources = {source: page for source, page in set(sources)}  # Remove duplicates
        if sources and answer!="The provided documents do not contain this information":
            answer += "\n\n📄 Sources:\n"
            for source, page in sources.items():
                answer += f"• {source}\n"
        return {"answer": answer, "tool": "pdf"}
    
    elif plan["tool"] == "order" or plan["tool"] == "cart":
        return {"answer": None, "tool": plan["tool"]}