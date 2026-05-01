import uuid
import os
import time
from datetime import datetime
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import utils.model as models
from utils.database import SessionLocal, engine, get_db
from core.engine import ScraperEngine
from plugins.trendyol import TrendyolPlugin

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Research Assistant API")

@app.post("/scrape")
def scrape_product(url: str, db: Session = Depends(get_db)):
    if "trendyol.com" not in url:
        raise HTTPException(status_code=400, detail="Only Trendyol links are supported.")

    try:
        # 1. Start Engine
        with ScraperEngine(url) as driver:
            # Small delay to allow Javascript to render on the Toshiba
            time.sleep(2) 
            
            plugin = TrendyolPlugin(driver)
            result = plugin.scrape()
            
            if result.get("status") == "success":
                # 2. Data Cleaning
                raw_price = str(result.get('price', '0'))
                clean_price = raw_price.replace('TL', '').replace(' ', '').replace('.', '').replace(',', '.')
                
                try:
                    final_price = float(clean_price)
                except ValueError:
                    final_price = 0.0

                # 3. Screenshot Logic
                BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                SCREENSHOT_DIR = os.path.join(BASE_DIR, "utils", "files")
                os.makedirs(SCREENSHOT_DIR, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_name = f"price_{timestamp}_{uuid.uuid4().hex[:6]}.png"
                screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_name)
                
                # Take screenshot
                driver.save_screenshot(screenshot_path)

                # 4. Database Save
                new_entry = models.PriceHistory(
                    product_name=result['title'],
                    product_url=url,
                    price=final_price,
                    screenshot_path=screenshot_path,
                    timestamp=datetime.utcnow()
                )
    
                db.add(new_entry)
                db.commit()
                db.refresh(new_entry)
    
                return {
                    "status": "success",
                    "data": {
                        "id": new_entry.id,
                        "title": new_entry.product_name,
                        "price": new_entry.price,
                        "screenshot": screenshot_name
                    }
                }
            else:
                # If the plugin failed, it usually means Trendyol blocked the request or changed CSS
                raise HTTPException(status_code=500, detail=f"Plugin Error: {result.get('message')}")
                
    except Exception as e:
        if 'db' in locals(): db.rollback()
        print(f"Detailed Error: {e}") # Look at your terminal for this!
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)