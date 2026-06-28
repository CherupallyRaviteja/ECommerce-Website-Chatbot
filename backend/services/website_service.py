import json
import os

class WebsiteService:

    def __init__(self):
        base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),"website_data")

        self.products = self._load_json(os.path.join(base_path, "products.json"))
        self.faq = self._load_json(os.path.join(base_path, "faq.json"))
        self.policies = self._load_json(os.path.join(base_path, "policies.json"))
        self.website_info = self._load_json(os.path.join(base_path, "website_info.json"))

    def _load_json(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
        
    def get_products(self):
        return self.products

    def get_faq(self):
        return self.faq

    def get_policies(self):
        return self.policies

    def get_website_info(self):
        return self.website_info