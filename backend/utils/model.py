from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    
   
    user_id = Column(String, index=True) 
    
    product_name = Column(String)
    product_url = Column(String, index=True)
    platform = Column(String) 
    category = Column(String, default="General") 
    
    price = Column(Float)
    target_price = Column(Float, nullable=True) 
    initial_price = Column(Float) 
    
    screenshot_path = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)