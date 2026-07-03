from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst")  # admin, analyst
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    predictions = relationship("Prediction", back_populates="predicted_by")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    
    # Demographic features
    gender = Column(String, nullable=False)
    partner = Column(String, nullable=False)
    dependents = Column(String, nullable=False)
    
    # Services
    phone_service = Column(String, nullable=False)
    multiple_lines = Column(String, nullable=False)
    internet_service = Column(String, nullable=False)
    online_security = Column(String, nullable=False)
    online_backup = Column(String, nullable=False)
    device_protection = Column(String, nullable=False)
    tech_support = Column(String, nullable=False)
    streaming_tv = Column(String, nullable=False)
    streaming_movies = Column(String, nullable=False)
    
    # Account features
    tenure = Column(Integer, nullable=False)
    contract = Column(String, nullable=False)
    paperless_billing = Column(String, nullable=False)
    payment_method = Column(String, nullable=False)
    monthly_charges = Column(Float, nullable=False)
    total_charges = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    predictions = relationship("Prediction", back_populates="customer", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    churn_probability = Column(Float, nullable=False)
    is_churn = Column(Boolean, nullable=False)
    shap_values = Column(JSON, nullable=True)  # Store JSON representation of SHAP features
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())
    predicted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    customer = relationship("Customer", back_populates="predictions")
    predicted_by = relationship("User", back_populates="predictions")
