from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from utils.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    product_name = Column(String)
    product_url = Column(String, unique=True) # Unique ensures no duplicate tracking
    platform = Column(String)
    
    # Core price metrics
    initial_price = Column(Float)
    current_price = Column(Float)
    target_price = Column(Float)
    
    # UI Metadata
    last_screenshot = Column(String)
    category = Column(String, nullable=True)

    # Relationship: One Product -> Many PriceHistory entries
    # 'cascade' ensures if you delete the product, its history is deleted too
    price_history = relationship("PriceHistory", back_populates="parent", cascade="all, delete-orphan")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Back-reference to the parent product
    parent = relationship("Product", back_populates="price_history")