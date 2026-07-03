from typing import List, Optional
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.db import get_db
from app.models.models import Customer, Prediction, User
from app.schemas.schemas import CustomerCreate, PredictionResponse, PredictionResult
from app.api.deps import get_current_user
from app.services.report_generator import generate_csv_report, generate_pdf_report
from ml.model import ChurnModelWrapper

router = APIRouter()

# Instantiate the ML model wrapper (loads models on module import)
model_wrapper = ChurnModelWrapper()

@router.post("/single/{customer_id_db}", response_model=PredictionResponse)
def predict_single_customer(
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
        
    # Format customer data into model input
    customer_dict = customer.__dict__.copy()
    
    # Remove SQLAlchemy keys
    customer_dict.pop("_sa_instance_state", None)
    customer_dict.pop("id", None)
    customer_dict.pop("created_at", None)
    
    # Run prediction and SHAP analysis
    try:
        pred_res = model_wrapper.predict_single(customer_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction error: {str(e)}"
        )
        
    # Save prediction to DB
    db_pred = Prediction(
        customer_id=customer.id,
        churn_probability=pred_res["churn_probability"],
        is_churn=pred_res["is_churn"],
        shap_values=pred_res["shap_values"],
        predicted_by_id=current_user.id
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred

@router.post("/manual", response_model=PredictionResponse)
def predict_manual_input(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # First, save this new customer record to the DB
    from app.api.customers import create_customer
    db_customer = create_customer(customer_in=customer_in, db=db, current_user=current_user)
    
    # Format and predict
    customer_dict = db_customer.__dict__.copy()
    customer_dict.pop("_sa_instance_state", None)
    customer_dict.pop("id", None)
    customer_dict.pop("created_at", None)
    
    try:
        pred_res = model_wrapper.predict_single(customer_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction error: {str(e)}"
        )
        
    db_pred = Prediction(
        customer_id=db_customer.id,
        churn_probability=pred_res["churn_probability"],
        is_churn=pred_res["is_churn"],
        shap_values=pred_res["shap_values"],
        predicted_by_id=current_user.id
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    return db_pred

@router.post("/batch")
def predict_batch_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if CSV
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV format"
        )
        
    try:
        contents = file.file.read()
        buffer = io.BytesIO(contents)
        df = pd.read_csv(buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read CSV: {str(e)}"
        )
        
    # Check model compatibility
    try:
        pred_df = model_wrapper.predict_batch(df)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV validation or prediction failed: {str(e)}"
        )
        
    # Create bulk list of customer and prediction objects
    total_records = len(pred_df)
    churn_count = 0
    
    from app.api.customers import generate_random_customer_id
    
    saved_count = 0
    # To keep this process robust, iterate and save (for production scale we would bulk_insert)
    for _, row in pred_df.iterrows():
        # Check if customer_id is in CSV, otherwise generate
        cust_id = row.get("customer_id")
        if pd.isna(cust_id) or not cust_id:
            cust_id = generate_random_customer_id()
            
        # Verify if customer exists already
        existing = db.query(Customer).filter(Customer.customer_id == str(cust_id)).first()
        if existing:
            db_customer = existing
        else:
            db_customer = Customer(
                customer_id=str(cust_id),
                name=str(row.get("name", f"Batch Cust {cust_id[:4]}")),
                email=str(row.get("email", f"batch.{cust_id}@example.com")),
                phone=str(row.get("phone", "+1-555-000-0000")),
                gender=str(row.get("gender", "Female")),
                partner=str(row.get("partner", "No")),
                dependents=str(row.get("dependents", "No")),
                phone_service=str(row.get("phone_service", "Yes")),
                multiple_lines=str(row.get("multiple_lines", "No")),
                internet_service=str(row.get("internet_service", "DSL")),
                online_security=str(row.get("online_security", "No")),
                online_backup=str(row.get("online_backup", "No")),
                device_protection=str(row.get("device_protection", "No")),
                tech_support=str(row.get("tech_support", "No")),
                streaming_tv=str(row.get("streaming_tv", "No")),
                streaming_movies=str(row.get("streaming_movies", "No")),
                tenure=int(row.get("tenure", 12)),
                contract=str(row.get("contract", "Month-to-month")),
                paperless_billing=str(row.get("paperless_billing", "No")),
                payment_method=str(row.get("payment_method", "Electronic check")),
                monthly_charges=float(row.get("monthly_charges", 50.0)),
                total_charges=float(row.get("total_charges", 600.0)),
            )
            db.add(db_customer)
            db.commit()
            db.refresh(db_customer)
            
        prob = float(row["churn_probability"])
        is_churn = bool(row["is_churn"])
        
        if is_churn:
            churn_count += 1
            
        # Single predict on the fly to get SHAP values for the DB
        # To avoid heavy batch computation we can calculate SHAP dynamically or generate on request.
        # But let's compute SHAP values for DB records to maintain database logs.
        # Since it's batch, we compute a quick single prediction for each to get SHAP
        cust_dict = db_customer.__dict__.copy()
        cust_dict.pop("_sa_instance_state", None)
        cust_dict.pop("id", None)
        cust_dict.pop("created_at", None)
        
        try:
            shap_res = model_wrapper.predict_single(cust_dict)
            shap_vals = shap_res["shap_values"]
        except Exception:
            shap_vals = []
            
        db_pred = Prediction(
            customer_id=db_customer.id,
            churn_probability=prob,
            is_churn=is_churn,
            shap_values=shap_vals,
            predicted_by_id=current_user.id
        )
        db.add(db_pred)
        saved_count += 1
        
    db.commit()
    
    return {
        "message": f"Successfully processed {total_records} customers",
        "total_records": total_records,
        "churn_predicted": churn_count,
        "non_churn_predicted": total_records - churn_count,
        "churn_rate": (churn_count / total_records * 100) if total_records > 0 else 0.0
    }

@router.get("/history", response_model=List[PredictionResponse])
def get_prediction_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    preds = db.query(Prediction).order_by(Prediction.predicted_at.desc()).limit(limit).all()
    return preds

@router.get("/report")
def get_churn_report(
    format: str = Query("pdf", description="Format of report: pdf or csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch latest prediction for each customer
    subquery = db.query(
        Prediction.customer_id,
        func.max(Prediction.predicted_at).label("max_date")
    ).group_by(Prediction.customer_id).subquery()
    
    latest_preds = db.query(Prediction).join(
        subquery,
        (Prediction.customer_id == subquery.c.customer_id) & 
        (Prediction.predicted_at == subquery.c.max_date)
    ).all()
    
    report_data = []
    for pred in latest_preds:
        report_data.append({
            "customer": pred.customer,
            "probability": pred.churn_probability,
            "is_churn": pred.is_churn
        })
        
    if not report_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No predictions found to generate report."
        )
        
    if format.lower() == "csv":
        stream = generate_csv_report(report_data)
        filename = f"churn_report_{func.now()}.csv"
        return StreamingResponse(
            stream, 
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=churn_report.csv"}
        )
    else:  # Default PDF
        stream = generate_pdf_report(report_data)
        return StreamingResponse(
            stream, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=churn_report.pdf"}
        )
