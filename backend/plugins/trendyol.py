from core.base_plugin import BasePlugin
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TrendyolPlugin(BasePlugin):
    
    @property
    def domain(self):
        return "trendyol.com"
    def scrape(self):
        wait = WebDriverWait(self.driver, 20)
        
        try:
            try:
                popup = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Anladım')]")))
                popup.click()
                time.sleep(2)
            except:
                pass

            title = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1"))).text

            price_element = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@id='envoy']/div/div[3]/div/div/span")))
            price = price_element.get_attribute('innerText').strip()

            return {
                "platform": "Trendyol",
                "title": title.strip(),
                "price": price,
                "status": "success"
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}