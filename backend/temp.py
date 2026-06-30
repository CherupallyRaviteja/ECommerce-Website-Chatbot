from services.planner_service import PlannerService
from services.knowledge_service import KnowledgeService
knowledge = KnowledgeService()
planner = PlannerService()
result = planner.plan("Do you have orange juice in stock")
products = knowledge.search_products(result["filters"])
print(result)