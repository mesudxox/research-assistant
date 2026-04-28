from core.engine import ScraperEngine
from plugins.trendyol import TrendyolPlugin

def run_scraper(url):
    
    with ScraperEngine(url) as driver:
        
      
        if "trendyol.com" in url:
            scraper = TrendyolPlugin(driver)
        else:
            print("Error: No plugin found for this domain.")
            return None

        result = scraper.scrape()
        
        return result

if __name__ == "__main__":
    test_url = "https://www.trendyol.com/tonny-black/unisex-beyaz-siyah-termo-taban-yani-seritli-bagcikli-spor-ayakkabi-p-879885114?boutiqueId=61&merchantId=106292"
    
    print("Starting the scraping process...")
    data = run_scraper(test_url)
    
    if data:
        print("Scrape Successful!")
        print(f"Data: {data}")