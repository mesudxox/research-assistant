from fastapi import FastAPI, HTTPException
from core.engine import ScraperEngine
from plugins.trendyol import TrendyolPlugin

app = FastAPI(title="Research Assistant API")

@app.get("/scrape")
async def scrape_product(url: str):
    # 1. Validation: Make sure it's a Trendyol link
    if "trendyol.com" not in url:
        raise HTTPException(status_code=400, detail="Only Trendyol links are supported currently.")

    try:
        # 2. Use your Engine (Context Manager)
        with ScraperEngine(url) as driver:
            # 3. Use your Plugin (The logic you won today!)
            plugin = TrendyolPlugin(driver)
            result = plugin.scrape()
            
            if result.get("status") == "success":
                return result
            else:
                raise HTTPException(status_code=500, detail=result.get("message"))
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

# This allows you to run it directly with 'python api.py'
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)