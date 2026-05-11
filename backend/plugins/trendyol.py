from core.base_plugin import BasePlugin
from selenium.webdriver.common.by import By
from selenium import webdriver

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import uuid
from datetime import datetime
import re


class TrendyolPlugin(BasePlugin):
    
    @property
    def domain(self):
        return "trendyol.com"

    def scrape(self):
        wait = WebDriverWait(self.driver, 20)
        
        try:
            title_element = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
            title = title_element.text.strip()
            print(f"DEBUG: Scrapping Sneaker: {title}")

            price = None
            universal_selectors = [
                ".product-price-container .prc-dsc",
                "span.discounted",
                ".price-view .discounted",
                ".prc-slg",
                "span.product-price",
                "//div[@class='price-container']//span"
            ]

            for selector in universal_selectors:
                try:
                    if selector.startswith("//"):
                        element = self.driver.find_element(By.XPATH, selector)
                    else:
                        element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    
                    if element.is_displayed():
                        text = element.text.strip()
                        if text and any(char.isdigit() for char in text) and "Kupon" not in text:
                            price = text
                            print(f"DEBUG: Caught price with {selector}: {price}")
                            break
                except:
                    continue

            if not price:
                try:
                    price = self.driver.find_element(By.XPATH, "//meta[@property='product:price:amount']").get_attribute("content")
                    print(f"DEBUG: Meta Tag Win: {price}")
                except:
                    pass

            if not price:
                raise Exception("Price element missing for this sneaker layout.")

            numeric_only = re.sub(r'[^\d,.]', '', price).replace(',', '.')
            
            matches = re.findall(r'\d+\.?\d*', numeric_only)
            clean_price = matches[-1] if matches else "0.00"

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_name = f"price_{timestamp}_{uuid.uuid4().hex[:6]}.png"
            screenshot_path = f"utils/static/{screenshot_name}"
            self.driver.save_screenshot(screenshot_path)

            return { 
                "platform": "Trendyol",
                "title": title,
                "price": clean_price,
                "status": "success",
                "screenshot": screenshot_name
            }

        except Exception as e:
            print(f"CRITICAL ERROR: {str(e)}")
            # This ensures FastAPI returns a 200 with an error msg instead of a 500 crash
            return {"status": "error", "message": str(e)}