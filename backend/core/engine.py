from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

class ScraperEngine:
    def __init__(self, url):
        self.url = url
        self.driver = None

    def __enter__(self):
        chrome_options = Options()
        chrome_options.add_argument("--headless")  
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
       
        self.driver = webdriver.Chrome(options=chrome_options)
        
        self.driver.get(self.url)
        
        return self.driver

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.driver:
            self.driver.quit()
            print("Engine: Browser closed safely.")
