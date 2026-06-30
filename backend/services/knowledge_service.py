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

        price_operator = None

        normal_filters = []

        for f in filters:
            if f["field"] == "price" and f["operator"] in ["min", "max"]:
                price_operator = f["operator"]
            else:
                normal_filters.append(f)

        for product in self.products:
            if self._matches(product, normal_filters):
                results.append(product)

        if price_operator == "min" and results:
            return [min(results, key=lambda x: x["price"])]

        if price_operator == "max" and results:
            return [max(results, key=lambda x: x["price"])]

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

        