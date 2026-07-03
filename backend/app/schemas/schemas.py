from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "analyst"

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    gender: str = Field(..., description="Male or Female")
    partner: str = Field(..., description="Yes or No")
    dependents: str = Field(..., description="Yes or No")
    phone_service: str = Field(..., description="Yes or No")
    multiple_lines: str = Field(..., description="Yes, No, or No phone service")
    internet_service: str = Field(..., description="DSL, Fiber optic, or No")
    online_security: str = Field(..., description="Yes, No, or No internet service")
    online_backup: str = Field(..., description="Yes, No, or No internet service")
    device_protection: str = Field(..., description="Yes, No, or No internet service")
    tech_support: str = Field(..., description="Yes, No, or No internet service")
    streaming_tv: str = Field(..., description="Yes, No, or No internet service")
    streaming_movies: str = Field(..., description="Yes, No, or No internet service")
    tenure: int = Field(..., ge=0)
    contract: str = Field(..., description="Month-to-month, One year, or Two year")
    paperless_billing: str = Field(..., description="Yes or No")
    payment_method: str = Field(..., description="Electronic check, Mailed check, Bank transfer, or Credit card")
    monthly_charges: float = Field(..., ge=0)
    total_charges: float = Field(..., ge=0)

class CustomerCreate(CustomerBase):
    customer_id: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    partner: Optional[str] = None
    dependents: Optional[str] = None
    phone_service: Optional[str] = None
    multiple_lines: Optional[str] = None
    internet_service: Optional[str] = None
    online_security: Optional[str] = None
    online_backup: Optional[str] = None
    device_protection: Optional[str] = None
    tech_support: Optional[str] = None
    streaming_tv: Optional[str] = None
    streaming_movies: Optional[str] = None
    tenure: Optional[int] = None
    contract: Optional[str] = None
    paperless_billing: Optional[str] = None
    payment_method: Optional[str] = None
    monthly_charges: Optional[float] = None
    total_charges: Optional[float] = None

class CustomerResponse(CustomerBase):
    id: int
    customer_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Prediction & SHAP Schemas ---
class SHAPFeatureImpact(BaseModel):
    feature: str
    display_name: str
    value: str
    shap_value: float

class PredictionResult(BaseModel):
    churn_probability: float
    is_churn: bool
    shap_values: List[SHAPFeatureImpact]

class PredictionResponse(BaseModel):
    id: int
    customer_id: int
    churn_probability: float
    is_churn: bool
    shap_values: List[SHAPFeatureImpact]
    predicted_at: datetime
    predicted_by_id: Optional[int] = None

    class Config:
        from_attributes = True

class CustomerWithPredictionResponse(CustomerResponse):
    latest_prediction: Optional[PredictionResponse] = None

# --- Dashboard Schemas ---
class DashboardStats(BaseModel):
    total_customers: int
    active_customers: int
    churned_customers: int
    churn_rate: float
    avg_tenure: float
    avg_monthly_charges: float
    high_risk_count: int  # Probability > 70%
    medium_risk_count: int  # Probability 30% - 70%
    low_risk_count: int  # Probability < 30%
    monthly_revenue: float
    churn_by_contract: dict
    churn_by_payment_method: dict
