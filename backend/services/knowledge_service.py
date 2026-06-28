import json
import os

class KnowledgeService:

    def __init__(self):
        base_path = os.path.join(os.path.dirname(__file__), "..","website_data")
        self.products = self._load_json(os.path.join(base_path, "products.json"))
        self.pages = self._load_json(os.path.join(base_path, "policies.json"))

    def _load_json(self, path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
        
    def search_products(self, filters):

        results = []

        for product in self.products:

            if self._matches(product, filters):
                results.append(product)

        return results

    def _matches(self, product, filters):

        for condition in filters:

            field = condition["field"]
            operator = condition["operator"]
            value = condition["value"]

            if field not in product:
                return False

            product_value = product[field]

            if operator == "equals":
                if str(product_value).lower() != str(value).lower():
                    return False

            elif operator == "<=":
                if product_value > value:
                    return False

            elif operator == ">=":
                if product_value < value:
                    return False

            elif operator == "<":
                if product_value >= value:
                    return False

            elif operator == ">":
                if product_value <= value:
                    return False

            elif operator == "contains":
                if str(value).lower() not in str(product_value).lower():
                    return False
        return True     
       
    def get_page(self, page_name):
        for page in self.pages:
            if page["page"].lower() == page_name.lower():
                return page
        return None

        