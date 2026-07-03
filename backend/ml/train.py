import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
import shap

def generate_synthetic_data(num_samples=2000):
    np.random.seed(42)
    
    # 1. Demographic Features
    gender = np.random.choice(["Male", "Female"], size=num_samples)
    partner = np.random.choice(["Yes", "No"], size=num_samples)
    dependents = np.random.choice(["Yes", "No"], size=num_samples, p=[0.3, 0.7])
    
    # 2. Account Features
    tenure = np.random.randint(1, 73, size=num_samples)
    contract = np.random.choice(["Month-to-month", "One year", "Two year"], size=num_samples, p=[0.55, 0.20, 0.25])
    paperless_billing = np.random.choice(["Yes", "No"], size=num_samples, p=[0.6, 0.4])
    payment_method = np.random.choice(
        ["Electronic check", "Mailed check", "Bank transfer", "Credit card"],
        size=num_samples,
        p=[0.35, 0.25, 0.20, 0.20]
    )
    
    # 3. Services
    phone_service = np.random.choice(["Yes", "No"], size=num_samples, p=[0.9, 0.1])
    multiple_lines = []
    internet_service = np.random.choice(["DSL", "Fiber optic", "No"], size=num_samples, p=[0.3, 0.5, 0.2])
    
    online_security = []
    online_backup = []
    device_protection = []
    tech_support = []
    streaming_tv = []
    streaming_movies = []
    
    for i in range(num_samples):
        # Multiple Lines depends on Phone Service
        if phone_service[i] == "No":
            multiple_lines.append("No phone service")
        else:
            multiple_lines.append(np.random.choice(["Yes", "No"], p=[0.45, 0.55]))
            
        # Services depend on Internet Service
        if internet_service[i] == "No":
            online_security.append("No internet service")
            online_backup.append("No internet service")
            device_protection.append("No internet service")
            tech_support.append("No internet service")
            streaming_tv.append("No internet service")
            streaming_movies.append("No internet service")
        else:
            online_security.append(np.random.choice(["Yes", "No"], p=[0.3, 0.7]))
            online_backup.append(np.random.choice(["Yes", "No"], p=[0.4, 0.6]))
            device_protection.append(np.random.choice(["Yes", "No"], p=[0.4, 0.6]))
            tech_support.append(np.random.choice(["Yes", "No"], p=[0.3, 0.7]))
            streaming_tv.append(np.random.choice(["Yes", "No"], p=[0.5, 0.5]))
            streaming_movies.append(np.random.choice(["Yes", "No"], p=[0.5, 0.5]))

    # Charges
    monthly_charges = []
    for i in range(num_samples):
        base_charge = 20.0
        if phone_service[i] == "Yes":
            base_charge += 10.0
            if multiple_lines[i] == "Yes":
                base_charge += 5.0
        if internet_service[i] == "DSL":
            base_charge += 30.0
        elif internet_service[i] == "Fiber optic":
            base_charge += 50.0
            
        # Add random variations for service add-ons
        addons = [online_security[i], online_backup[i], device_protection[i], tech_support[i], streaming_tv[i], streaming_movies[i]]
        addon_count = sum(1 for a in addons if a == "Yes")
        base_charge += addon_count * 8.0
        
        # Add noise
        base_charge += np.random.normal(0, 5)
        monthly_charges.append(max(15.0, round(base_charge, 2)))
        
    monthly_charges = np.array(monthly_charges)
    total_charges = np.round(monthly_charges * tenure + np.random.normal(0, 20, size=num_samples), 2)
    total_charges = np.clip(total_charges, monthly_charges, None)  # Total charges must be at least monthly charges
    
    # Create DataFrame
    df = pd.DataFrame({
        "gender": gender,
        "partner": partner,
        "dependents": dependents,
        "tenure": tenure,
        "phone_service": phone_service,
        "multiple_lines": multiple_lines,
        "internet_service": internet_service,
        "online_security": online_security,
        "online_backup": online_backup,
        "device_protection": device_protection,
        "tech_support": tech_support,
        "streaming_tv": streaming_tv,
        "streaming_movies": streaming_movies,
        "contract": contract,
        "paperless_billing": paperless_billing,
        "payment_method": payment_method,
        "monthly_charges": monthly_charges,
        "total_charges": total_charges
    })
    
    # 4. Generate Target (Churn) using logical probabilities
    churn_prob = np.zeros(num_samples) + 0.15  # base rate
    
    churn_prob[df["contract"] == "Month-to-month"] += 0.30
    churn_prob[df["contract"] == "One year"] += 0.05
    churn_prob[df["contract"] == "Two year"] -= 0.10
    
    churn_prob[df["tenure"] < 12] += 0.20
    churn_prob[df["tenure"] > 48] -= 0.15
    
    churn_prob[df["internet_service"] == "Fiber optic"] += 0.15
    churn_prob[df["tech_support"] == "No"] += 0.10
    churn_prob[df["online_security"] == "No"] += 0.05
    
    churn_prob[df["payment_method"] == "Electronic check"] += 0.10
    churn_prob[df["monthly_charges"] > 85] += 0.05
    
    # Cap probabilities
    churn_prob = np.clip(churn_prob, 0.02, 0.95)
    
    # Churn outcome
    churn = np.random.binomial(1, churn_prob)
    df["churn"] = churn
    
    # Add a mock customer_id
    df.insert(0, "customer_id", [f"{np.random.randint(1000, 9999)}-{np.random.choice(['AAAA', 'BBBB', 'CCCC', 'DDDD'])}{i:04d}" for i in range(num_samples)])
    
    # Add mock names and contacts
    names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia"]
    surnames = ["Smith", "Doe", "Johnson", "Brown", "Taylor", "Miller", "Wilson", "Davis", "White", "Clark", "Hall", "Thomas"]
    
    df.insert(1, "name", [f"{np.random.choice(names)} {np.random.choice(surnames)}" for _ in range(num_samples)])
    df.insert(2, "email", [f"{row['name'].lower().replace(' ', '.')}@example.com" for _, row in df.iterrows()])
    df.insert(3, "phone", [f"+1-555-{np.random.randint(100, 999)}-{np.random.randint(1000, 9999)}" for _ in range(num_samples)])
    
    return df

def train_model():
    print("Generating synthetic customer churn data...")
    df = generate_synthetic_data(2000)
    
    # Save synthetic data to CSV
    os.makedirs("ml/data", exist_ok=True)
    df.to_csv("ml/data/synthetic_data.csv", index=False)
    print("Saved synthetic data to ml/data/synthetic_data.csv")
    
    # Separate features and target
    X = df.drop(columns=["customer_id", "name", "email", "phone", "churn"])
    y = df["churn"]
    
    # Get columns
    categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
    numerical_cols = X.select_dtypes(include=["number"]).columns.tolist()
    
    print(f"Categorical features: {categorical_cols}")
    print(f"Numerical features: {numerical_cols}")
    
    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numerical_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols)
        ]
    )
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Preprocessing data...")
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)
    
    # Extract feature names after transformations
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_feature_names = cat_encoder.get_feature_names_out(categorical_cols).tolist()
    feature_names = numerical_cols + cat_feature_names
    
    print(f"Total features after encoding: {len(feature_names)}")
    
    # Train RandomForest model
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10, min_samples_split=5)
    model.fit(X_train_transformed, y_train)
    
    accuracy = model.score(X_test_transformed, y_test)
    print(f"Model test accuracy: {accuracy:.4f}")
    
    # Create SHAP explainer
    print("Creating TreeSHAP explainer...")
    # Use a small background dataset for path explanation or just the tree explainer directly
    # TreeExplainer works directly on RF and is very fast
    explainer = shap.TreeExplainer(model, X_train_transformed[:100])
    
    # Save artifacts
    artifacts = {
        "preprocessor": preprocessor,
        "model": model,
        "feature_names": feature_names,
        "numerical_cols": numerical_cols,
        "categorical_cols": categorical_cols,
        "explainer_data": X_train_transformed[:100]  # Store background data to reconstruct explainer if needed
    }
    
    with open("ml/data/preprocessor.pkl", "wb") as f:
        pickle.dump(preprocessor, f)
        
    with open("ml/data/model.pkl", "wb") as f:
        pickle.dump(model, f)
        
    with open("ml/data/explainer.pkl", "wb") as f:
        pickle.dump(explainer, f)
        
    # Save feature names list
    with open("ml/data/metadata.pkl", "wb") as f:
        pickle.dump({
            "feature_names": feature_names,
            "numerical_cols": numerical_cols,
            "categorical_cols": categorical_cols
        }, f)
        
    print("All model artifacts saved successfully in ml/data/")

if __name__ == "__main__":
    train_model()
