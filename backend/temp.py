from services.planner_service import PlannerService
from services.knowledge_service import KnowledgeService
knowledge = KnowledgeService()
planner = PlannerService()
result = planner.plan("How long is the warranty?")
products = knowledge.search_products(result["filters"])
print(result)
print("\n\n",products)