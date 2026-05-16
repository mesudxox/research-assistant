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
from utils.model import Product
from apscheduler.schedulers.background import BackgroundScheduler
import time
import random

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

def auto_check_prices():
    """Background task to update prices every 6 hours"""
    db = SessionLocal()
    try:
        products = db.query(models.Product).all()
        print(f"--- [Auto-Scrape] Starting sync for {len(products)} items ---")
        for product in products:
            try:
                with ScraperEngine(product.product_url) as driver:
                    plugin = TrendyolPlugin(driver) 
                    result = plugin.scrape()
                    if result.get("status") == "success":
                        raw_price = str(result.get('price', '0'))
                        clean_price = raw_price.replace('TL', '').replace(' ', '').replace('.', '').replace(',', '.')
                        final_price = float(clean_price)
                        
                        product.current_price = final_price
                        
                        new_point = models.PriceHistory(product_id=product.id, price=final_price)
                        db.add(new_point)
                        
                        if final_price <= product.target_price:
                            print(f"NOTIFICATION: {product.product_name} hit target!")
                
                db.commit()
                time.sleep(random.uniform(5, 10)) 
            except Exception as e:
                print(f"Failed to auto-scrape {product.id}: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(func=auto_check_prices, trigger="interval", hours=6)
scheduler.start()

@app.post("/scrape/{platform}")
def scrape_product(
    platform: str, 
    url: str, 
    user_id: str,
    db: Session = Depends(get_db)
):
    if platform == "trendyol" and "trendyol.com" not in url:
        raise HTTPException(status_code=400, detail="URL mismatch for Trendyol.")

    clean_url = url.split('?')[0]

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

                product = db.query(models.Product).filter(
                    models.Product.product_url == clean_url,
                    models.Product.user_id == user_id
                ).first()

                if not product:
                    product = models.Product(
                        user_id=user_id,             
                        product_name=result['title'],
                        product_url=clean_url,
                        platform=platform.upper(),
                        initial_price=final_price,   
                        current_price=final_price,
                        target_price=final_price * 0.9, 
                        last_screenshot=screenshot_name
                    )
                    db.add(product)
                    db.commit()
                    db.refresh(product)
                else:
                    product.current_price = final_price
                    product.last_screenshot = screenshot_name
                    db.commit()

                new_history_point = models.PriceHistory(
                    product_id=product.id,
                    price=final_price,
                    timestamp=datetime.utcnow()
                )
                db.add(new_history_point)
                db.commit()

             
                history_points = db.query(models.PriceHistory).filter(
                    models.PriceHistory.product_id == product.id
                ).order_by(models.PriceHistory.timestamp.asc()).all()

                return {
                    "status": "success",
                    "data": {
                        "id": product.id,
                        "title": product.product_name,
                        "price": product.current_price,
                        "target_price": product.target_price,
                        "platform": product.platform,
                        "screenshot": product.last_screenshot,
                        "history": [hp.price for hp in history_points] if history_points else [product.current_price],
                        "dates": [hp.timestamp.strftime("%b %d") for hp in history_points] if history_points else ["Now"]
                    }
                }
            else:
                raise HTTPException(status_code=500, detail=result.get('message'))
                
    except Exception as e:
        db.rollback()
        print(f"SCRAPE ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Engine Error: {str(e)}")
@app.get("/history")
async def get_history(user_id: str, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.user_id == user_id).all()
    
    history_data = []
    for p in products:
        history_data.append({
            "id": p.id,
            "title": p.product_name,
            "price": p.current_price,
            "target_price": p.target_price,
            "screenshot": p.last_screenshot,
            "platform": p.platform,
            "product_url": p.product_url 
        })
    
    return history_data

@app.patch("/items/{item_id}/target")
def update_target(item_id: int, target: float, db: Session = Depends(get_db)):
    item = db.query(models.Product).filter(models.Product.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.target_price = target
    db.commit()
    return {"status": "success"}
@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    try:
        
        item = db.query(Product).filter(Product.id == product_id).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Product not found")

        db.delete(item)
        
        db.commit()
        
        return {"status": "success", "message": f"Product {product_id} deleted"}
        
    except Exception as e:
        db.rollback() 
        print(f"Error deleting product: {e}")
        return {"status": "error", "message": str(e)}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)