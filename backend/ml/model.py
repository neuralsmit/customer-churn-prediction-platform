import os
import pickle
import numpy as np
import pandas as pd
import shap

class ChurnModelWrapper:
    def __init__(self, model_dir: str = "ml/data"):
        self.model_dir = model_dir
        self.model = None
        self.preprocessor = None
        self.explainer = None
        self.feature_names = []
        self.numerical_cols = []
        self.categorical_cols = []
        self.is_loaded = False
        
        # Load artifacts if they exist
        self.load_model()
        
    def load_model(self):
        try:
            model_path = os.path.join(self.model_dir, "model.pkl")
            preprocessor_path = os.path.join(self.model_dir, "preprocessor.pkl")
            explainer_path = os.path.join(self.model_dir, "explainer.pkl")
            metadata_path = os.path.join(self.model_dir, "metadata.pkl")
            
            if (os.path.exists(model_path) and 
                os.path.exists(preprocessor_path) and 
                os.path.exists(explainer_path) and 
                os.path.exists(metadata_path)):
                
                with open(model_path, "rb") as f:
                    self.model = pickle.load(f)
                with open(preprocessor_path, "rb") as f:
                    self.preprocessor = pickle.load(f)
                with open(explainer_path, "rb") as f:
                    self.explainer = pickle.load(f)
                with open(metadata_path, "rb") as f:
                    metadata = pickle.load(f)
                    self.feature_names = metadata["feature_names"]
                    self.numerical_cols = metadata["numerical_cols"]
                    self.categorical_cols = metadata["categorical_cols"]
                
                self.is_loaded = True
                print("ML Model and Explainer loaded successfully.")
            else:
                print(f"Model files not found in {self.model_dir}. Please run train.py first.")
        except Exception as e:
            print(f"Error loading model files: {e}")
            self.is_loaded = False

    def predict_single(self, customer_data: dict):
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Please train the model first.")
            
        # Convert single dict to DataFrame
        df = pd.DataFrame([customer_data])
        
        # Keep only features used in training
        all_features = self.numerical_cols + self.categorical_cols
        df = df[all_features]
        
        # Transformed representation
        X_transformed = self.preprocessor.transform(df)
        
        # Predict probability
        # RandomForest returns probabilities [P(Class 0), P(Class 1)]
        prob = self.model.predict_proba(X_transformed)[0][1]
        is_churn = bool(prob >= 0.5)
        
        # SHAP calculation
        shap_values = self.explainer.shap_values(X_transformed)
        
        # Handle SHAP output format. It can be:
        # - A list of arrays (one per class): [shap_for_class0, shap_for_class1]
        # - A single 3D or 2D array
        if isinstance(shap_values, list):
            # Class 1 (Churn) is index 1
            shap_for_record = shap_values[1][0]
        elif len(shap_values.shape) == 3:
            # Shape is (samples, features, classes)
            shap_for_record = shap_values[0, :, 1]
        else:
            # Shape is (samples, features) for binary output
            shap_for_record = shap_values[0]
            
        # Format SHAP feature importances
        shap_details = []
        
        # Get raw values for feature context
        # We need to find which transformed features are active
        for i, feat_name in enumerate(self.feature_names):
            shap_val = float(shap_for_record[i])
            
            # Create a clean display name
            display_name = feat_name
            actual_val = ""
            
            # Check if categorical
            is_cat = False
            for cat_col in self.categorical_cols:
                if feat_name.startswith(cat_col + "_"):
                    category = feat_name[len(cat_col) + 1:]
                    display_name = f"{cat_col.replace('_', ' ').title()}: {category}"
                    # Check if this category is active in input
                    is_active = (df[cat_col].iloc[0] == category)
                    actual_val = "Yes" if is_active else "No"
                    is_cat = True
                    break
                    
            if not is_cat:
                display_name = feat_name.replace("_", " ").title()
                actual_val = str(df[feat_name].iloc[0])
                
            # Only include features with a non-trivial SHAP contribution to make the visualization clean
            # (or we return all, and let the frontend filter/sort)
            shap_details.append({
                "feature": feat_name,
                "display_name": display_name,
                "value": actual_val,
                "shap_value": shap_val
            })
            
        # Sort by absolute SHAP value descending (most impactful first)
        shap_details.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        
        # Return probability, binary output, and SHAP details
        return {
            "churn_probability": float(prob),
            "is_churn": is_churn,
            "shap_values": shap_details[:10]  # Return top 10 most impactful features for cleaner display
        }

    def predict_batch(self, df: pd.DataFrame):
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Please train the model first.")
            
        all_features = self.numerical_cols + self.categorical_cols
        
        # Normalize incoming CSV column headers to match snake_case variables
        # Map lowercase names without underscores to our model features
        norm_map = {f.lower().replace("_", ""): f for f in all_features}
        # Also map standard contact attributes
        norm_map["customerid"] = "customer_id"
        norm_map["name"] = "name"
        norm_map["email"] = "email"
        norm_map["phone"] = "phone"
        
        # Build renaming dictionary
        rename_dict = {}
        for col in df.columns:
            cleaned_col = str(col).lower().replace("_", "").replace(" ", "").replace("-", "").replace("?", "")
            if cleaned_col in norm_map:
                rename_dict[col] = norm_map[cleaned_col]
                
        df_renamed = df.rename(columns=rename_dict)
        
        # Smart mapping for custom churn datasets (e.g. Kaggle/GitHub datasets)
        
        # 1. Map account length or similar to tenure
        if "tenure" not in df_renamed.columns:
            for col in df_renamed.columns:
                col_clean = str(col).lower().replace("_", "").replace(" ", "").replace("-", "")
                if "accountlength" in col_clean or "acctlength" in col_clean or "length" in col_clean or "months" in col_clean:
                    df_renamed["tenure"] = df_renamed[col]
                    break
                    
        # 2. Map phone columns
        if "phone" not in df_renamed.columns:
            for col in df_renamed.columns:
                if "phone" in str(col).lower():
                    df_renamed["phone"] = df_renamed[col]
                    break
                    
        # 3. Sum charge columns to approximate monthly charges
        if "monthly_charges" not in df_renamed.columns:
            charge_cols = [c for c in df_renamed.columns if "charge" in str(c).lower() and "total" not in str(c).lower()]
            if charge_cols:
                df_renamed["monthly_charges"] = df_renamed[charge_cols].sum(axis=1)
            else:
                df_renamed["monthly_charges"] = 50.0
                
        # 4. Map or calculate total charges
        if "total_charges" not in df_renamed.columns:
            total_cols = [c for c in df_renamed.columns if "totalcharge" in str(c).lower().replace("_","").replace(" ","")]
            if total_cols:
                df_renamed["total_charges"] = df_renamed[total_cols[0]]
            else:
                tenure_col = df_renamed.get("tenure", 12)
                # Handle series conversion safely
                if isinstance(tenure_col, pd.Series):
                    df_renamed["total_charges"] = df_renamed["monthly_charges"] * tenure_col
                else:
                    df_renamed["total_charges"] = df_renamed["monthly_charges"] * 12
                
        # Fill missing features with default values to satisfy preprocessor
        defaults = {
            "gender": "Female",
            "partner": "No",
            "dependents": "No",
            "tenure": 12,
            "phone_service": "Yes",
            "multiple_lines": "No",
            "internet_service": "DSL",
            "online_security": "No",
            "online_backup": "No",
            "device_protection": "No",
            "tech_support": "No",
            "streaming_tv": "No",
            "streaming_movies": "No",
            "contract": "Month-to-month",
            "paperless_billing": "Yes",
            "payment_method": "Electronic check",
            "monthly_charges": 50.0,
            "total_charges": 600.0,
        }
        
        for col in all_features:
            if col not in df_renamed.columns:
                df_renamed[col] = defaults[col]
            else:
                df_renamed[col] = df_renamed[col].fillna(defaults[col])
                
        # Normalize categorical values to match trained encoder categories
        for col in self.categorical_cols:
            if col in df_renamed.columns:
                # Map booleans to strings
                df_renamed[col] = df_renamed[col].replace({True: "Yes", False: "No"})
                # Convert strings to title case and clean up
                df_renamed[col] = df_renamed[col].astype(str).str.strip().str.title()
                # Handle specific title casing discrepancies
                df_renamed[col] = df_renamed[col].replace({
                    "Month-To-Month": "Month-to-month",
                    "Fiber Optic": "Fiber optic",
                    "No Phone Service": "No phone service",
                    "No Internet Service": "No internet service",
                    "Bank Transfer": "Bank transfer",
                    "Credit Card": "Credit card",
                    "Electronic Check": "Electronic check",
                    "Mailed Check": "Mailed check",
                    "False": "No",
                    "True": "Yes"
                })
                
        X = df_renamed[all_features]
        X_transformed = self.preprocessor.transform(X)
        
        probs = self.model.predict_proba(X_transformed)[:, 1]
        predictions = (probs >= 0.5).astype(int)
        
        # For batch, return renamed df with probability and prediction columns
        result_df = df_renamed.copy()
        result_df["churn_probability"] = probs
        result_df["is_churn"] = predictions
        
        return result_df
