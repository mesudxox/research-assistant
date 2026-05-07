import uuid
import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import utils.model as models
from utils.database import SessionLocal, engine, get_db
from core.engine import ScraperEngine
from plugins.trendyol import TrendyolPlugin

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="XOX Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="utils/files"), name="static")

@app.post("/scrape/{platform}")
def scrape_product(
    platform: str, 
    url: str, 
    user_id: str,
    db: Session = Depends(get_db)
):
    if platform == "trendyol" and "trendyol.com" not in url:
        raise HTTPException(status_code=400, detail="URL mismatch.")

    try:
        with ScraperEngine(url) as driver:
            if platform == "trendyol":
                plugin = TrendyolPlugin(driver)
            
            result = plugin.scrape()
            
            if result.get("status") == "success":
                raw_price = str(result.get('price', '0'))
                clean_price = raw_price.replace('TL', '').replace(' ', '').replace('.', '').replace(',', '.')
                final_price = float(clean_price) if clean_price else 0.0
                
                BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                SCREENSHOT_DIR = os.path.join(BASE_DIR, "utils", "files")
                os.makedirs(SCREENSHOT_DIR, exist_ok=True)
                screenshot_name = f"price_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.png"
                screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_name)
                driver.save_screenshot(screenshot_path)

                new_entry = models.PriceHistory(
                    user_id=user_id,             
                    product_name=result['title'],
                    product_url=url,
                    platform=platform.upper(),
                    price=final_price,
                    initial_price=final_price,   
                    target_price=final_price * 0.9, 
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
                        "targetPrice": new_entry.target_price,
                        "platform": new_entry.platform,
                        "screenshot": screenshot_name
                    }
                }
            else:
                raise HTTPException(status_code=500, detail=result.get('message'))
                
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def get_history(
    user_id: str = Query(...), 
    db: Session = Depends(get_db)
):
  
    history = db.query(models.PriceHistory)\
                .filter(models.PriceHistory.user_id == user_id)\
                .order_by(models.PriceHistory.timestamp.desc())\
                .all()
                
    return [
        {
            "id": item.id,
            "title": item.product_name,
            "price": item.price,
            "targetPrice": item.target_price,
            "platform": item.platform,
            "category": item.category,
            "time": item.timestamp.strftime("%H:%M"),
            "screenshot": os.path.basename(item.screenshot_path)
        } for item in history
    ]

@app.patch("/items/{item_id}/target")
def update_target(item_id: int, target: float, db: Session = Depends(get_db)):
    item = db.query(models.PriceHistory).filter(models.PriceHistory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.target_price = target
    db.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)