from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.db import get_db
from app.models.models import Customer, Prediction, User
from app.schemas.schemas import DashboardStats
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total customers
    total_cust = db.query(func.count(Customer.id)).scalar() or 0
    
    # If no customers, return empty stats
    if total_cust == 0:
        return DashboardStats(
            total_customers=0,
            active_customers=0,
            churned_customers=0,
            churn_rate=0.0,
            avg_tenure=0.0,
            avg_monthly_charges=0.0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            monthly_revenue=0.0,
            churn_by_contract={},
            churn_by_payment_method={}
        )
        
    # Get latest prediction for each customer
    subquery = db.query(
        Prediction.customer_id,
        func.max(Prediction.predicted_at).label("max_date")
    ).group_by(Prediction.customer_id).subquery()
    
    latest_preds = db.query(
        Prediction.customer_id,
        Prediction.churn_probability,
        Prediction.is_churn,
        Customer.contract,
        Customer.payment_method,
        Customer.monthly_charges,
        Customer.tenure
    ).join(
        Customer, Customer.id == Prediction.customer_id
    ).join(
        subquery,
        (Prediction.customer_id == subquery.c.customer_id) & 
        (Prediction.predicted_at == subquery.c.max_date)
    ).all()
    
    # Calculated parameters
    predicted_cust_ids = {p.customer_id for p in latest_preds}
    
    # We want average monthly charges and tenure for ALL customers in DB
    avg_tenure = db.query(func.avg(Customer.tenure)).scalar() or 0.0
    avg_monthly_charges = db.query(func.avg(Customer.monthly_charges)).scalar() or 0.0
    monthly_revenue = db.query(func.sum(Customer.monthly_charges)).scalar() or 0.0
    
    # Predict-based summaries
    churned_count = sum(1 for p in latest_preds if p.is_churn)
    active_count = total_cust - churned_count
    
    churn_rate = (churned_count / len(latest_preds) * 100) if latest_preds else 0.0
    
    high_risk = sum(1 for p in latest_preds if p.churn_probability >= 0.70)
    medium_risk = sum(1 for p in latest_preds if 0.30 <= p.churn_probability < 0.70)
    # Customers with no prediction yet are considered low risk or default active
    unpredicted_count = total_cust - len(latest_preds)
    low_risk = sum(1 for p in latest_preds if p.churn_probability < 0.30) + unpredicted_count
    
    # Breakdowns by contract
    # Contract values: Month-to-month, One year, Two year
    contract_stats = {}
    # Base count of all customers by contract
    all_contracts = db.query(Customer.contract, func.count(Customer.id)).group_by(Customer.contract).all()
    for contract_name, count in all_contracts:
        contract_stats[contract_name] = {"total": count, "churn": 0, "active": count}
        
    # Overlay predictions
    for p in latest_preds:
        c_name = p.contract
        if c_name in contract_stats:
            if p.is_churn:
                contract_stats[c_name]["churn"] += 1
                contract_stats[c_name]["active"] -= 1
                
    # Breakdowns by payment method
    pm_stats = {}
    all_pms = db.query(Customer.payment_method, func.count(Customer.id)).group_by(Customer.payment_method).all()
    for pm_name, count in all_pms:
        pm_stats[pm_name] = {"total": count, "churn": 0, "active": count}
        
    for p in latest_preds:
        pm_name = p.payment_method
        if pm_name in pm_stats:
            if p.is_churn:
                pm_stats[pm_name]["churn"] += 1
                pm_stats[pm_name]["active"] -= 1
                
    return DashboardStats(
        total_customers=total_cust,
        active_customers=active_count,
        churned_customers=churned_count,
        churn_rate=churn_rate,
        avg_tenure=float(avg_tenure),
        avg_monthly_charges=float(avg_monthly_charges),
        high_risk_count=high_risk,
        medium_risk_count=medium_risk,
        low_risk_count=low_risk,
        monthly_revenue=float(monthly_revenue),
        churn_by_contract=contract_stats,
        churn_by_payment_method=pm_stats
    )
