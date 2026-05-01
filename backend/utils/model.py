from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String)
    product_url = Column(String, index=True)
    price = Column(Float)
    screenshot_path = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)