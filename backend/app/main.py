import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import engine, Base, wait_for_db, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Customer, Prediction
from app.api import auth, customers, predictions, dashboard

# Import model training to ensure model exists on startup
from ml.train import train_model
from ml.model import ChurnModelWrapper

# 1. Initialize DB and Seed Data if needed
def seed_database(db: Session):
    # Check if a user exists
    user = db.query(User).first()
    if not user:
        print("Seeding database: creating default analyst user...")
        hashed_password = get_password_hash("password123")
        default_user = User(
            username="analyst",
            hashed_password=hashed_password,
            role="analyst"
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        user = default_user
        
    # Check if customers exist
    customer_count = db.query(Customer).count()
    if customer_count == 0:
        print("Seeding database: importing synthetic customers and generating predictions...")
        # Check if synthetic CSV exists, otherwise train model which also creates it
        csv_path = "ml/data/synthetic_data.csv"
        if not os.path.exists(csv_path):
            print("Model files not found. Running training script...")
            train_model()
            
        import pandas as pd
        df = pd.read_csv(csv_path)
        
        # Load a slice of synthetic data (e.g., 50 customers to populate initial database)
        seed_df = df.head(50)
        
        # Instantiate prediction wrapper
        model_wrapper = ChurnModelWrapper()
        
        for _, row in seed_df.iterrows():
            db_customer = Customer(
                customer_id=str(row["customer_id"]),
                name=str(row["name"]),
                email=str(row["email"]),
                phone=str(row["phone"]),
                gender=str(row["gender"]),
                partner=str(row["partner"]),
                dependents=str(row["dependents"]),
                phone_service=str(row["phone_service"]),
                multiple_lines=str(row["multiple_lines"]),
                internet_service=str(row["internet_service"]),
                online_security=str(row["online_security"]),
                online_backup=str(row["online_backup"]),
                device_protection=str(row["device_protection"]),
                tech_support=str(row["tech_support"]),
                streaming_tv=str(row["streaming_tv"]),
                streaming_movies=str(row["streaming_movies"]),
                tenure=int(row["tenure"]),
                contract=str(row["contract"]),
                paperless_billing=str(row["paperless_billing"]),
                payment_method=str(row["payment_method"]),
                monthly_charges=float(row["monthly_charges"]),
                total_charges=float(row["total_charges"]),
            )
            db.add(db_customer)
            db.commit()
            db.refresh(db_customer)
            
            # Predict
            cust_dict = db_customer.__dict__.copy()
            cust_dict.pop("_sa_instance_state", None)
            cust_dict.pop("id", None)
            cust_dict.pop("created_at", None)
            
            pred_res = model_wrapper.predict_single(cust_dict)
            
            db_pred = Prediction(
                customer_id=db_customer.id,
                churn_probability=pred_res["churn_probability"],
                is_churn=pred_res["is_churn"],
                shap_values=pred_res["shap_values"],
                predicted_by_id=user.id
            )
            db.add(db_pred)
            
        db.commit()
        print("Database seeded with 50 customers and predictions successfully!")

# 2. Setup FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 3. Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customers"])
app.include_router(predictions.router, prefix=f"{settings.API_V1_STR}/predictions", tags=["Predictions"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])

@app.on_event("startup")
def startup_event():
    # Wait for PostgreSQL database container to respond
    db_connected = wait_for_db()
    if not db_connected:
        print("Database connection failed. Exiting.")
        os._exit(1)
        
    # Create tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Check if models are trained
    model_path = "ml/data/model.pkl"
    if not os.path.exists(model_path):
        print("No pre-trained model found. Initiating Random Forest training...")
        train_model()
        
    # Seed default user and records
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    print(f"{settings.PROJECT_NAME} started successfully!")

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API. Access docs at /docs"}
