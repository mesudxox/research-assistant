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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Research Assistant API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="utils/files"), name="static")


@app.post("/scrape/{platform}")
def scrape_product(platform: str, url: str, db: Session = Depends(get_db)):
    if platform == "trendyol" and "trendyol.com" not in url:
        raise HTTPException(status_code=400, detail="URL does not match selected platform.")

    try:
        with ScraperEngine(url) as driver:
            if platform == "trendyol":
                plugin = TrendyolPlugin(driver)
           
            
            result = plugin.scrape()
            # ... rest of your saving logic ...
            
            if result.get("status") == "success":
                raw_price = str(result.get('price', '0'))
                clean_price = raw_price.replace('TL', '').replace(' ', '').replace('.', '').replace(',', '.')
                
                try:
                    final_price = float(clean_price)
                except ValueError:
                    final_price = 0.0

                BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                SCREENSHOT_DIR = os.path.join(BASE_DIR, "utils", "files")
                os.makedirs(SCREENSHOT_DIR, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_name = f"price_{timestamp}_{uuid.uuid4().hex[:6]}.png"
                screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_name)
                
                driver.save_screenshot(screenshot_path)

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
                raise HTTPException(status_code=500, detail=f"Plugin Error: {result.get('message')}")
                
    except Exception as e:
        if 'db' in locals(): db.rollback()
        print(f"Detailed Error: {e}") # Look at your terminal for this!
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    # Fetch the last 10 price records
    history = db.query(models.PriceHistory).order_by(models.PriceHistory.timestamp.desc()).limit(10).all()
    return [
        {
            "id": item.id,
            "title": item.product_name,
            "price": item.price,
            "time": item.timestamp.strftime("%H:%M"),
            "screenshot": os.path.basename(item.screenshot_path),
            "trend": "neutral" # You can calculate this by comparing to the previous price
        } for item in history
    ]
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)