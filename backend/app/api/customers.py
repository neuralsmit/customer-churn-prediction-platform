import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.db import get_db
from app.models.models import Customer, Prediction, User
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerWithPredictionResponse
from app.api.deps import get_current_user

router = APIRouter()

def generate_random_customer_id() -> str:
    num_part = "".join(random.choices(string.digits, k=4))
    char_part = "".join(random.choices(string.ascii_uppercase, k=4))
    serial = "".join(random.choices(string.digits, k=4))
    return f"{num_part}-{char_part}{serial}"

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify unique customer_id
    cust_id = customer_in.customer_id
    if not cust_id:
        # Generate unique code
        for _ in range(5):
            temp_id = generate_random_customer_id()
            if not db.query(Customer).filter(Customer.customer_id == temp_id).first():
                cust_id = temp_id
                break
        else:
            cust_id = generate_random_customer_id()
            
    # Check if duplicate custom id exists
    if db.query(Customer).filter(Customer.customer_id == cust_id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer ID {cust_id} already exists"
        )
        
    db_customer = Customer(
        **customer_in.model_dump(),
        customer_id=cust_id
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[CustomerWithPredictionResponse])
def read_customers(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.customer_id.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )
        
    customers = query.offset(skip).limit(limit).all()
    
    # Enrich with latest prediction
    result = []
    for c in customers:
        latest_pred = db.query(Prediction).filter(Prediction.customer_id == c.id).order_by(Prediction.predicted_at.desc()).first()
        
        # We manually build the response to match schema
        c_dict = c.__dict__.copy()
        c_dict["latest_prediction"] = latest_pred
        result.append(c_dict)
        
    return result

@router.get("/{customer_id_db}", response_model=CustomerWithPredictionResponse)
def read_customer(
    customer_id_db: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id_db).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    latest_pred = db.query(Prediction).filter(Prediction.customer_id == customer.id).order_by(Prediction.predicted_at.desc()).first()
    
    customer_dict = customer.__dict__.copy()
    customer_dict["latest_prediction"] = latest_pred
    return customer_dict

@router.put("/{customer_id_db}", response_model=CustomerResponse)
def update_customer(
    customer_id_db: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id_db).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    update_data = customer_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
        
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id_db}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id_db: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id_db).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
        
    db.delete(customer)
    db.commit()
    return None
