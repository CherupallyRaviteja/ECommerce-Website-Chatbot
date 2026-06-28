from services.planner_service import PlannerService
from services.knowledge_service import KnowledgeService
from generator import generate_website_answer
from controller import route
planner = PlannerService()
service = KnowledgeService()

while True:
    query = input("\nYou: ")

    if query.lower() == "exit":
        break

    try:
        result = route(query)
        answer = generate_website_answer(query, result)
        print("\n Output:")
        print(answer)

    except Exception as e:
        print(e)