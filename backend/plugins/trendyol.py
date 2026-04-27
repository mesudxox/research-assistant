from core.base_plugin import BasePlugin

class TrendyolPlugin(BasePlugin):
    
    @property
    def domain(self):
        return "trendyol.com"

    def scrape(self):
   
        data = {
            "platform": "Trendyol",
            "title": "Product Title Placeholder",
            "price": 0.0,
            "status": "success"
        }
        return data