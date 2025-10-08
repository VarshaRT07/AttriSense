import matplotlib
matplotlib.use('Agg')  # Set backend BEFORE importing pyplot
import matplotlib.pyplot as plt

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import joblib
import shap
import io
import base64
import numpy as np
from typing import List, Dict, Any, Optional
import warnings
warnings.filterwarnings('ignore')

# Initialize FastAPI app
app = FastAPI(title="AttriSense ML API - AI-Powered Attrition Intelligence", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and data
print("Loading models and data...")
try:
    employee_pipeline = joblib.load("xgb_pipeline.joblib")
    print("✅ Employee model loaded")
except Exception as e:
    print(f"❌ Error loading employee model: {e}")
    employee_pipeline = None

try:
    survey_pipeline = joblib.load("xgb_survey_pipeline.joblib")
    print("✅ Survey model loaded")
except Exception as e:
    print(f"❌ Error loading survey model: {e}")
    survey_pipeline = None

try:
    employee_data = pd.read_csv("final_filtered_employees.csv")
    print(f"✅ Employee dataset loaded ({len(employee_data)} rows)")
except Exception as e:
    print(f"❌ Error loading employee dataset: {e}")
    employee_data = None

try:
    survey_data = pd.read_csv("reliable_employee_survey_data.csv")
    print(f"✅ Survey dataset loaded ({len(survey_data)} rows)")
except Exception as e:
    print(f"❌ Error loading survey dataset: {e}")
    survey_data = None

# Global variables for explainers and cached data
employee_explainer = None
survey_explainer = None
employee_feature_names = []
survey_feature_names = []
employee_feature_display_names = []
survey_feature_display_names = []

# Cache for preprocessed data (for faster plot generation)
employee_sample_X = None
employee_sample_shap_values = None
survey_sample_X = None
survey_sample_shap_values = None

# Store pipeline components globally
employee_model = None
employee_preprocessor = None
survey_model = None
survey_scaler = None

# Feature name mapping for better display
def create_feature_display_name(feature_name: str) -> str:
    """Convert technical feature names to readable display names"""
    # Remove prefixes
    name = feature_name.replace('num__', '').replace('cat__', '')

    # Replace underscores with spaces
    name = name.replace('_', ' ')

    # Capitalize each word
    name = ' '.join(word.capitalize() for word in name.split())

    return name

# Helper function to convert matplotlib figure to base64
def fig_to_base64(fig) -> str:
    """Convert matplotlib figure to base64 encoded string"""
    try:
        buf = io.BytesIO()
        # Reduced DPI for faster generation
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=80)
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        plt.close(fig)
        return img_base64
    except Exception as e:
        print(f"Error converting figure to base64: {e}")
        plt.close(fig)
        raise

def initialize_explainers():
    """Initialize SHAP explainers and pre-compute sample data"""
    global employee_explainer, survey_explainer
    global employee_feature_names, survey_feature_names
    global employee_feature_display_names, survey_feature_display_names
    global employee_sample_X, employee_sample_shap_values
    global survey_sample_X, survey_sample_shap_values
    global employee_model, employee_preprocessor, survey_model, survey_scaler

    print("Initializing SHAP explainers and pre-computing sample data...")

    # Initialize employee explainer
    if employee_pipeline is not None and employee_data is not None:
        try:
            # Get model and preprocessor from pipeline
            employee_model = employee_pipeline.named_steps['classifier']
            employee_preprocessor = employee_pipeline.named_steps['preprocessor']

            # Prepare sample data (reduced size for faster computation)
            sample_size = min(50, len(employee_data))
            sample_df = employee_data.sample(n=sample_size, random_state=42)

            # Transform data
            employee_sample_X = employee_preprocessor.transform(employee_data)

            # Get feature names
            if hasattr(employee_preprocessor, 'get_feature_names_out'):
                employee_feature_names = list(employee_preprocessor.get_feature_names_out())
            else:
                employee_feature_names = [f"feature_{i}" for i in range(employee_sample_X.shape[1])]

            # Create display names
            employee_feature_display_names = [create_feature_display_name(name) for name in employee_feature_names]

            # Create explainer
            employee_explainer = shap.TreeExplainer(employee_model)

            # Pre-compute SHAP values for sample data
            employee_sample_shap_values = employee_explainer.shap_values(employee_sample_X)

            print(f"✅ Employee explainer initialized with {len(employee_feature_names)} features")
            print(f"✅ Pre-computed SHAP values for {sample_size} samples")

        except Exception as e:
            print(f"❌ Error initializing employee explainer: {e}")
            import traceback
            traceback.print_exc()

    # Initialize survey explainer
    if survey_pipeline is not None and survey_data is not None:
        try:
            # Get model and scaler from pipeline
            survey_model = survey_pipeline.named_steps['classifier']
            survey_scaler = survey_pipeline.named_steps['scaler']

            # Prepare sample data (reduced size for faster computation)
            sample_size = min(50, len(survey_data))
            # sample_df = survey_data.sample(n=sample_size, random_state=42)
            sample_df = survey_data

            # Drop columns that weren't present during training
            columns_to_drop = ['Employee ID', 'Full Name', 'Attrition_Prob', 'Attrition']
            sample_df = sample_df.drop(columns=[col for col in columns_to_drop if col in sample_df.columns])

            # Transform data
            survey_sample_X = survey_scaler.transform(sample_df)

            # Get feature names (survey features are already clean)
            if hasattr(survey_scaler, 'get_feature_names_out'):
                survey_feature_names = list(survey_scaler.get_feature_names_out())
            else:
                survey_feature_names = list(sample_df.columns)

            # Survey features are already readable, so display names are the same
            survey_feature_display_names = survey_feature_names.copy()

            # Create explainer
            survey_explainer = shap.TreeExplainer(survey_model)

            # Pre-compute SHAP values for sample data
            survey_sample_shap_values = survey_explainer.shap_values(survey_sample_X)

            print(f"✅ Survey explainer initialized with {len(survey_feature_names)} features")
            print(f"✅ Pre-computed SHAP values for {sample_size} samples")

        except Exception as e:
            print(f"❌ Error initializing survey explainer: {e}")
            import traceback
            traceback.print_exc()

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    initialize_explainers()

# Pydantic models
class EmployeeData(BaseModel):
    Age: int
    Gender: str
    Years_of_experience: int = Field(..., alias="Years of experience")
    Job_Role: str = Field(..., alias="Job Role")
    Salary: float
    Performance_Rating: int = Field(..., alias="Performance Rating")
    Number_of_Promotions: int = Field(..., alias="Number of Promotions")
    Overtime: str
    Commuting_distance: float = Field(..., alias="Commuting distance")
    Education_Level: str = Field(..., alias="Education Level")
    Marital_Status: str = Field(..., alias="Marital Status")
    Number_of_Dependents: int = Field(..., alias="Number of Dependents")
    Job_Level: int = Field(..., alias="Job Level")
    Last_hike: float = Field(..., alias="Last hike")
    Years_in_current_role: int = Field(..., alias="Years in current role")
    Working_model: str = Field(..., alias="Working model")
    Working_hours: int = Field(..., alias="Working hours")
    Department: str
    No_of_companies_worked_previously: int = Field(..., alias="No. of companies worked previously")
    LeavesTaken: int
    YearsWithCompany: int

    class Config:
        # allow both field names and aliases when populating the model
        allow_population_by_field_name = True
        validate_assignment = True

# AttritionRecord model for batch predictions with employee demographics
class AttritionRecord(BaseModel):
    EmployeeID: Optional[int] = Field(None, alias="Employee ID")
    FullName: Optional[str] = Field(None, alias="Full Name")

    # employee details
    Age: int = Field(..., alias="Age")
    Gender: str = Field(..., alias="Gender")
    Years_of_experience: int = Field(..., alias="Years of experience")
    Job_Role: str = Field(..., alias="Job Role")
    Salary: float = Field(..., alias="Salary")
    Performance_Rating: int = Field(..., alias="Performance Rating")
    Number_of_Promotions: int = Field(..., alias="Number of Promotions")
    Overtime: str = Field(..., alias="Overtime")
    Commuting_distance: float = Field(..., alias="Commuting distance")
    Education_Level: str = Field(..., alias="Education Level")
    Marital_Status: str = Field(..., alias="Marital Status")
    Number_of_Dependents: int = Field(..., alias="Number of Dependents")
    Job_Level: int = Field(..., alias="Job Level")
    Last_hike: float = Field(..., alias="Last hike")
    Years_in_current_role: int = Field(..., alias="Years in current role")
    Working_model: str = Field(..., alias="Working model")
    Working_hours: float = Field(..., alias="Working hours")
    Department: str = Field(..., alias="Department")
    No_of_companies_worked_previously: int = Field(..., alias="No. of companies worked previously")
    LeavesTaken: int = Field(..., alias="LeavesTaken")
    YearsWithCompany: int = Field(..., alias="YearsWithCompany")

    class Config:
        allow_population_by_field_name = True
        validate_assignment = True

# SurveyDetails model for survey-based predictions
class SurveyDetails(BaseModel):
    EmployeeID: Optional[int] = Field(None, alias="Employee ID")
    FullName: Optional[str] = Field(None, alias="Full Name")

    # survey fields
    Work_Life_Balance: int = Field(..., alias="Work-Life Balance")
    Job_Satisfaction: int = Field(..., alias="Job Satisfaction")
    Relationship_with_Manager: int = Field(..., alias="Relationship with Manager")
    Communication_effectiveness: int = Field(..., alias="Communication effectiveness")
    Recognition_and_Reward_Satisfaction: int = Field(..., alias="Recognition and Reward Satisfaction")
    Career_growth_and_advancement_opportunities: int = Field(..., alias="Career growth and advancement opportunities")
    Alignment_with_Company_Values_Mission: int = Field(..., alias="Alignment with Company Values/Mission")
    Perceived_fairness: int = Field(..., alias="Perceived fairness")
    Team_cohesion_and_peer_support: int = Field(..., alias="Team cohesion and peer support")
    Autonomy_at_work: int = Field(..., alias="Autonomy at work")
    Overall_engagement: int = Field(..., alias="Overall engagement")
    Training_and_skill_development_satisfaction: int = Field(..., alias="Training and skill development satisfaction")
    Stress_levels_work_pressure: int = Field(..., alias="Stress levels/work pressure")
    Organizational_change_readiness: int = Field(..., alias="Organizational change readiness")
    Feedback_frequency_and_usefulness: int = Field(..., alias="Feedback frequency and usefulness")
    Flexibility_support: int = Field(..., alias="Flexibility support")
    Conflict_at_work: int = Field(..., alias="Conflict at work")
    Perceived_job_security: int = Field(..., alias="Perceived job security")
    Environment_satisfaction: int = Field(..., alias="Environment satisfaction")

    class Config:
        allow_population_by_field_name = True
        validate_assignment = True

# Helper function to convert AttritionRecord list to DataFrame
def prepare_df(records: List[AttritionRecord]) -> pd.DataFrame:
    data = [r.model_dump(by_alias=True) for r in records]
    df = pd.DataFrame(data)
    return df

# Helper function to convert SurveyDetails list to DataFrame
def prepare_survey_df(records: List[SurveyDetails]) -> pd.DataFrame:
    data = [r.model_dump(by_alias=True) for r in records]
    df = pd.DataFrame(data)
    return df

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "employee_model_loaded": employee_pipeline is not None,
        "survey_model_loaded": survey_pipeline is not None,
        "employee_explainer_ready": employee_explainer is not None,
        "survey_explainer_ready": survey_explainer is not None,
    }

# Get features with display names
@app.get("/features")
def get_features():
    return {
        "employee_features": employee_feature_names if employee_feature_names else [],
        "survey_features": survey_feature_names if survey_feature_names else [],
        "employee_display_names": employee_feature_display_names if employee_feature_display_names else [],
        "survey_display_names": survey_feature_display_names if survey_feature_display_names else [],
    }

# Prediction endpoint
@app.post("/predict")
def predict(data: Dict[str, Any]):
    if employee_pipeline is None:
        raise HTTPException(status_code=503, detail="Employee model not loaded")

    try:
        # Convert dict to DataFrame
        df = pd.DataFrame([data])

        # Make prediction
        prediction = employee_pipeline.predict_proba(df)[0, 1]

        return {
            "attrition_probability": float(prediction),
            "risk_level": "High" if prediction >= 0.7 else "Medium" if prediction >= 0.4 else "Low"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

# Batch prediction endpoint for employee demographics
@app.post("/predict_batch")
def predict_batch(records: List[AttritionRecord]):
    if employee_pipeline is None:
        raise HTTPException(status_code=503, detail="Employee model not loaded")

    try:
        df = prepare_df(records)
        id_cols = ["Employee ID", "Full Name"]
        ids_df = df[id_cols] if all(col in df.columns for col in id_cols) else None

        # Drop ID columns before prediction (they're not features)
        feature_df = df.drop(columns=[col for col in id_cols if col in df.columns], errors='ignore')

        # Use the full pipeline for prediction (it handles preprocessing internally)
        proba_all = employee_pipeline.predict_proba(feature_df)[:, 1]

        # For SHAP, we need to transform the data first
        if employee_explainer is not None and employee_preprocessor is not None:
            try:
                # Transform features using the preprocessor
                X_transformed = employee_preprocessor.transform(feature_df)

                # Get SHAP values
                shap_values_all = employee_explainer.shap_values(X_transformed)

                # Use the transformed feature names for SHAP
                feature_names = employee_feature_names if employee_feature_names else []
            except Exception as e:
                print(f"Warning: SHAP computation failed: {e}")
                # Fallback: no SHAP values
                shap_values_all = np.zeros((len(records), len(feature_df.columns)))
                feature_names = list(feature_df.columns)
        else:
            # Fallback if explainer not initialized
            shap_values_all = np.zeros((len(records), len(feature_df.columns)))
            feature_names = list(feature_df.columns)

        results = []

        for i in range(len(records)):
            # Calculate SHAP contributions
            if len(feature_names) > 0 and len(shap_values_all) > i:
                contrib_pairs = list(zip(feature_names, shap_values_all[i]))
                positive = sorted(
                    [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
                )[:3]
                negative = sorted(
                    [p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1]
                )[:3]
            else:
                positive = []
                negative = []

            result = {
                "attrition_probability": float(proba_all[i]),
                "risk_level": "High" if proba_all[i] >= 0.7 else "Medium" if proba_all[i] >= 0.4 else "Low",
                "top_positive_contributors": [
                    {"feature": f, "contribution": float(c)} for f, c in positive
                ],
                "top_negative_contributors": [
                    {"feature": f, "contribution": float(c)} for f, c in negative
                ],
            }

            # Add ID fields if available
            if ids_df is not None:
                result["Employee ID"] = str(ids_df.iloc[i]["Employee ID"]) if "Employee ID" in ids_df.columns else None
                result["Full Name"] = str(ids_df.iloc[i]["Full Name"]) if "Full Name" in ids_df.columns else None

            results.append(result)

        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Batch prediction error: {str(e)}")

# Single prediction endpoint for survey data
@app.post("/survey_predict")
def survey_predict(record: SurveyDetails):
    if survey_pipeline is None:
        raise HTTPException(status_code=503, detail="Survey model not loaded")

    if survey_model is None or survey_scaler is None:
        raise HTTPException(status_code=503, detail="Survey model components not initialized")

    try:
        df = prepare_survey_df([record])
        id_cols = ["Employee ID", "Full Name"]
        ids = df[id_cols].iloc[0] if all(col in df.columns for col in id_cols) else None

        # Get survey feature names
        s_feature_names = survey_feature_names if survey_feature_names else [
            "Work-Life Balance",
            "Job Satisfaction",
            "Relationship with Manager",
            "Communication effectiveness",
            "Recognition and Reward Satisfaction",
            "Career growth and advancement opportunities",
            "Alignment with Company Values/Mission",
            "Perceived fairness",
            "Team cohesion and peer support",
            "Autonomy at work",
            "Overall engagement",
            "Training and skill development satisfaction",
            "Stress levels/work pressure",
            "Organizational change readiness",
            "Feedback frequency and usefulness",
            "Flexibility support",
            "Conflict at work",
            "Perceived job security",
            "Environment satisfaction",
        ]

        features = df[s_feature_names]
        scaled = survey_scaler.transform(features)

        proba = survey_model.predict_proba(scaled)[0, 1]

        # SHAP
        if survey_explainer is not None:
            shap_values = survey_explainer(scaled)
            contrib_pairs = list(zip(s_feature_names, shap_values.values[0]))
        else:
            # Fallback if explainer not initialized
            contrib_pairs = [(f, 0.0) for f in s_feature_names]

        positive = sorted(
            [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
        )[:3]
        negative = sorted(
            [p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1]
        )[:3]

        result = {
            "attrition_probability": float(proba),
            "risk_level": "High" if proba >= 0.7 else "Medium" if proba >= 0.4 else "Low",
            "top_positive_contributors": [
                {"feature": f, "contribution": float(c)} for f, c in positive
            ],
            "top_negative_contributors": [
                {"feature": f, "contribution": float(c)} for f, c in negative
            ],
        }

        # Add ID fields if available
        if ids is not None:
            result["Employee ID"] = str(ids["Employee ID"]) if "Employee ID" in ids else None
            result["Full Name"] = str(ids["Full Name"]) if "Full Name" in ids else None

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Survey prediction error: {str(e)}")

# Batch prediction endpoint for survey data
@app.post("/survey_predict_batch")
def survey_predict_batch(records: List[SurveyDetails]):
    if survey_pipeline is None:
        raise HTTPException(status_code=503, detail="Survey model not loaded")

    if survey_model is None or survey_scaler is None:
        raise HTTPException(status_code=503, detail="Survey model components not initialized")

    try:
        df = prepare_survey_df(records)
        id_cols = ["Employee ID", "Full Name"]
        ids_df = df[id_cols] if all(col in df.columns for col in id_cols) else None

        # Get survey feature names
        s_feature_names = survey_feature_names if survey_feature_names else [
            "Work-Life Balance",
            "Job Satisfaction",
            "Relationship with Manager",
            "Communication effectiveness",
            "Recognition and Reward Satisfaction",
            "Career growth and advancement opportunities",
            "Alignment with Company Values/Mission",
            "Perceived fairness",
            "Team cohesion and peer support",
            "Autonomy at work",
            "Overall engagement",
            "Training and skill development satisfaction",
            "Stress levels/work pressure",
            "Organizational change readiness",
            "Feedback frequency and usefulness",
            "Flexibility support",
            "Conflict at work",
            "Perceived job security",
            "Environment satisfaction",
        ]

        features = df[s_feature_names]
        scaled = survey_scaler.transform(features)
        proba_all = survey_model.predict_proba(scaled)[:, 1]

        # SHAP
        if survey_explainer is not None:
            shap_vals_all = survey_explainer(scaled)
        else:
            # Fallback if explainer not initialized
            shap_vals_all = type('obj', (object,), {'values': np.zeros((len(records), len(s_feature_names)))})()

        results = []
        for i in range(len(records)):
            contrib_pairs = list(zip(s_feature_names, shap_vals_all.values[i]))
            positive = sorted(
                [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
            )[:3]
            negative = sorted(
                [p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1]
            )[:3]

            result = {
                "attrition_probability": float(proba_all[i]),
                "risk_level": "High" if proba_all[i] >= 0.7 else "Medium" if proba_all[i] >= 0.4 else "Low",
                "top_positive_contributors": [
                    {"feature": f, "contribution": float(c)} for f, c in positive
                ],
                "top_negative_contributors": [
                    {"feature": f, "contribution": float(c)} for f, c in negative
                ],
            }

            # Add ID fields if available
            if ids_df is not None:
                result["Employee ID"] = str(ids_df.iloc[i]["Employee ID"]) if "Employee ID" in ids_df.columns else None
                result["Full Name"] = str(ids_df.iloc[i]["Full Name"]) if "Full Name" in ids_df.columns else None

            results.append(result)

        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Survey batch prediction error: {str(e)}")

# SHAP Summary Plot (Optimized with cached data)
@app.get("/shap/summary")
def get_shap_summary():
    if employee_explainer is None or employee_sample_shap_values is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Use pre-computed SHAP values
        shap_values = employee_sample_shap_values
        X_sample = employee_sample_X

        # Create plot with violin pattern
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, feature_names=employee_feature_display_names,
                         show=False, plot_type="violin")
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "summary",
            "image": img_base64,
            "format": "png"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating summary plot: {str(e)}")

# SHAP Feature Importance (Optimized with cached data)
@app.get("/shap/feature_importance")
def get_feature_importance():
    if employee_explainer is None or employee_sample_shap_values is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Use pre-computed SHAP values
        shap_values = employee_sample_shap_values
        X_sample = employee_sample_X

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, feature_names=employee_feature_display_names,
                         show=False, plot_type="bar")
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "feature_importance",
            "image": img_base64,
            "format": "png"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating feature importance plot: {str(e)}")

# SHAP Dependence Plot (Optimized with cached data)
@app.get("/shap/dependence")
def get_dependence_plot(feature: str):
    """
    Get SHAP dependence plot for a specific feature.

    Args:
        feature: Feature name (use query parameter, e.g., ?feature=num__Age)
    """
    if employee_explainer is None or employee_sample_shap_values is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Find feature index
        if feature not in employee_feature_names:
            raise HTTPException(status_code=404, detail=f"Feature '{feature}' not found. Available features: {employee_feature_names[:5]}...")

        feature_idx = employee_feature_names.index(feature)

        # Use pre-computed SHAP values
        shap_values = employee_sample_shap_values
        X_sample = employee_sample_X

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 6))
        shap.dependence_plot(feature_idx, shap_values, X_sample,
                            feature_names=employee_feature_display_names, show=False, ax=ax)
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "dependence",
            "feature": feature,
            "display_name": employee_feature_display_names[feature_idx],
            "image": img_base64,
            "format": "png"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating dependence plot: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating summary plot: {str(e)}")

# SHAP Feature Importance
@app.get("/shap/feature_importance")
def get_feature_importance():
    if employee_explainer is None or employee_data is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Prepare data
        sample_size = min(100, len(employee_data))
        sample_df = employee_data.sample(n=sample_size, random_state=42)

        # Transform data
        preprocessor = employee_pipeline.named_steps['preprocessor']
        X_sample = preprocessor.transform(sample_df)

        # Calculate SHAP values
        shap_values = employee_explainer.shap_values(X_sample)

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, feature_names=employee_feature_names,
                         show=False, plot_type="bar")
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "feature_importance",
            "image": img_base64,
            "format": "png"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating feature importance plot: {str(e)}")
# Removed duplicate SHAP dependence endpoint that used path parameters.
# Use the existing dependence endpoint (e.g., a POST-based one) to avoid duplicate routes.

# SHAP Force Plot
@app.post("/shap/force_plot")
def get_force_plot(data: Dict[str, Any]):
    if employee_explainer is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Extract and preserve employee ID before any transformation (handle both keys)
        employee_id = data.get("Employee ID", data.get("employee_id", "Unknown"))

        # Convert dict to DataFrame
        df = pd.DataFrame([data])

        # Transform data
        preprocessor = employee_pipeline.named_steps['preprocessor']
        X = preprocessor.transform(df)

        # Get prediction
        model = employee_pipeline.named_steps['classifier']
        prediction = model.predict_proba(X)[0, 1]

        # Calculate SHAP values
        shap_values = employee_explainer.shap_values(X)

        # Get base value (expected value)
        base_value = employee_explainer.expected_value

        # Create a custom force plot visualization using matplotlib
        fig, ax = plt.subplots(figsize=(16, 6))

        # Get SHAP values and feature names
        shap_vals = shap_values[0]
        features = X[0]

        # Create data for visualization
        feature_data = []
        for i, (val, feat_val) in enumerate(zip(shap_vals, features)):
            if abs(val) > 0.001:  # Only show significant features
                feature_data.append({
                    'name': employee_feature_display_names[i],  # Use display names
                    'shap_value': val,
                    'feature_value': feat_val
                })

        # Sort by absolute SHAP value
        feature_data.sort(key=lambda x: abs(x['shap_value']), reverse=True)

        # Take top 15 features
        feature_data = feature_data[:15]

        # Create horizontal bar chart
        y_pos = np.arange(len(feature_data))
        shap_values_plot = [f['shap_value'] for f in feature_data]
        colors = ['#ff0051' if v > 0 else '#008bfb' for v in shap_values_plot]

        ax.barh(y_pos, shap_values_plot, color=colors, alpha=0.8)
        ax.set_yticks(y_pos)
        ax.set_yticklabels([f"{f['name']}" for f in feature_data], fontsize=10)
        ax.set_xlabel('SHAP Value (Impact on Prediction)', fontsize=12, fontweight='bold')
        ax.set_title(f'Force Plot - Employee {employee_id}\nBase Value: {base_value:.3f} → Prediction: {prediction:.3f}',
                    fontsize=14, fontweight='bold', pad=20)

        # Add vertical line at 0
        ax.axvline(x=0, color='black', linestyle='-', linewidth=0.8)

        # Add grid
        ax.grid(axis='x', alpha=0.3, linestyle='--')

        # Add value labels on bars
        for i, (pos, val) in enumerate(zip(y_pos, shap_values_plot)):
            label = f'{val:.3f}'
            x_pos = val + (0.01 if val > 0 else -0.01)
            ha = 'left' if val > 0 else 'right'
            ax.text(x_pos, pos, label, va='center', ha=ha, fontsize=9, fontweight='bold')

        # Add legend
        from matplotlib.patches import Patch
        legend_elements = [
            Patch(facecolor='#ff0051', alpha=0.8, label='Increases Attrition Risk'),
            Patch(facecolor='#008bfb', alpha=0.8, label='Decreases Attrition Risk')
        ]
        ax.legend(handles=legend_elements, loc='lower right', fontsize=10)

        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "force",
            "employee_id": employee_id,
            "image": img_base64,
            "format": "png",
            "base_value": float(base_value),
            "prediction": float(prediction)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating force plot: {str(e)}")

# SHAP Waterfall Plot
@app.post("/shap/waterfall")
def get_waterfall_plot(data: Dict[str, Any]):
    if employee_explainer is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Extract and store employee ID before processing (handle both keys)
        employee_id = data.get("Employee ID", data.get("employee_id", "Unknown"))

        # Convert dict to DataFrame
        df = pd.DataFrame([data])

        # Transform data
        preprocessor = employee_pipeline.named_steps['preprocessor']
        X = preprocessor.transform(df)

        # Get prediction using classifier
        classifier = employee_pipeline.named_steps['classifier']
        prediction = classifier.predict_proba(X)[0, 1]

        # Calculate SHAP values
        shap_values = employee_explainer.shap_values(X)

        # Get base value
        base_value = employee_explainer.expected_value

        # Create waterfall plot
        fig, ax = plt.subplots(figsize=(10, 8))

        # Create explanation object for waterfall plot with display names
        explanation = shap.Explanation(
            values=shap_values[0],
            base_values=base_value,
            data=X[0],
            feature_names=employee_feature_display_names  # Use display names
        )

        shap.plots.waterfall(explanation, show=False)
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "waterfall",
            "employee_id": employee_id,
            "image": img_base64,
            "format": "png",
            "base_value": float(base_value),
            "prediction": float(prediction)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating waterfall plot: {str(e)}")

# SHAP Decision Plot
@app.post("/shap/decision_plot")
def get_decision_plot(data: List[Dict[str, Any]]):
    if employee_explainer is None:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")

    try:
        # Convert list of dicts to DataFrame
        df = pd.DataFrame(data)

        # Transform data
        preprocessor = employee_pipeline.named_steps['preprocessor']
        X = preprocessor.transform(df)

        # Calculate SHAP values
        shap_values = employee_explainer.shap_values(X)

        # Get base value
        base_value = employee_explainer.expected_value

        # Create decision plot
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.decision_plot(base_value, shap_values, X,
                          feature_names=employee_feature_names, show=False)
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "decision",
            "num_employees": len(data),
            "image": img_base64,
            "format": "png"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating decision plot: {str(e)}")

# Survey SHAP Summary
# Survey SHAP Summary Plot (Optimized with cached data)
@app.get("/shap/survey/summary")
def get_survey_summary():
    if survey_explainer is None or survey_sample_shap_values is None:
        raise HTTPException(status_code=503, detail="Survey SHAP explainer not initialized")

    try:
        # Use pre-computed SHAP values and sample data for faster response
        shap_values = survey_sample_shap_values
        X_sample = survey_sample_X

        # Create plot with violin pattern
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, feature_names=survey_feature_display_names,
                         show=False, plot_type="violin")
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "survey_summary",
            "image": img_base64,
            "format": "png"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating survey summary plot: {str(e)}")

# Survey SHAP Force Plot
@app.post("/shap/survey/force_plot")
def get_survey_force_plot(data: Dict[str, Any]):
    if survey_explainer is None:
        raise HTTPException(status_code=503, detail="Survey SHAP explainer not initialized")

    try:
        # Extract and store employee ID before processing
        employee_id = data.get("Employee ID", data.get("employee_id", "Unknown"))

        # Convert dict to DataFrame
        df = pd.DataFrame([data])

        # Drop only the columns that weren't present during training
        # Keep all the actual survey feature columns!
        columns_to_drop = ['Employee ID', 'Full Name', 'Attrition_Prob', 'Attrition']
        df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])

        # Transform data - survey pipeline uses 'scaler' instead of 'preprocessor'
        scaler = survey_pipeline.named_steps['scaler']
        X = scaler.transform(df)

        # Get prediction using classifier step
        model = survey_pipeline.named_steps['classifier']
        prediction = model.predict_proba(X)[0, 1]

        # Calculate SHAP values
        shap_values = survey_explainer.shap_values(X)

        # Get base value
        base_value = survey_explainer.expected_value

        # Create custom force plot visualization (horizontal bar chart)
        # Get SHAP values for this instance
        shap_vals = shap_values[0]
        feature_vals = X[0]

        # Create DataFrame for easier manipulation with display names
        force_df = pd.DataFrame({
            'feature': survey_feature_display_names,  # Use display names
            'shap_value': shap_vals,
            'feature_value': feature_vals
        })

        # Sort by absolute SHAP value and take top 15
        force_df['abs_shap'] = abs(force_df['shap_value'])
        force_df = force_df.nlargest(15, 'abs_shap')
        force_df = force_df.sort_values('shap_value')

        # Create horizontal bar chart
        fig, ax = plt.subplots(figsize=(12, 8))

        colors = ['#ff0051' if x > 0 else '#008bfb' for x in force_df['shap_value']]
        bars = ax.barh(range(len(force_df)), force_df['shap_value'], color=colors, alpha=0.8)

        # Customize plot
        ax.set_yticks(range(len(force_df)))
        ax.set_yticklabels([f"{feat} = {val:.2f}" for feat, val in
                           zip(force_df['feature'], force_df['feature_value'])], fontsize=10)
        ax.set_xlabel('SHAP Value (Impact on Prediction)', fontsize=12, fontweight='bold')
        ax.set_title(f'Survey Force Plot - Top 15 Features\nBase Value: {base_value:.3f} → Prediction: {prediction:.3f}',
                    fontsize=14, fontweight='bold', pad=20)
        ax.axvline(x=0, color='black', linestyle='-', linewidth=0.8)
        ax.grid(axis='x', alpha=0.3, linestyle='--')

        # Add value labels on bars
        for i, (bar, val) in enumerate(zip(bars, force_df['shap_value'])):
            width = bar.get_width()
            label_x = width + (0.01 if width > 0 else -0.01)
            ha = 'left' if width > 0 else 'right'
            ax.text(label_x, bar.get_y() + bar.get_height()/2, f'{val:.3f}',
                   ha=ha, va='center', fontsize=9, fontweight='bold')

        # Add legend
        from matplotlib.patches import Patch
        legend_elements = [
            Patch(facecolor='#FF6B6B', alpha=0.8, label='Increases Risk'),
            Patch(facecolor='#4ECDC4', alpha=0.8, label='Decreases Risk')
        ]
        ax.legend(handles=legend_elements, loc='lower right', fontsize=10)

        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "survey_force",
            "employee_id": employee_id,
            "image": img_base64,
            "format": "png",
            "base_value": float(base_value),
            "prediction": float(prediction)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating survey force plot: {str(e)}")

# Survey SHAP Feature Importance
# Survey SHAP Feature Importance (Optimized with cached data)
@app.get("/shap/survey/feature_importance")
def get_survey_feature_importance():
    if survey_explainer is None or survey_sample_shap_values is None:
        raise HTTPException(status_code=503, detail="Survey SHAP explainer not initialized")

    try:
        # Use pre-computed SHAP values
        shap_values = survey_sample_shap_values
        X_sample = survey_sample_X

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_values, X_sample, feature_names=survey_feature_display_names,
                         show=False, plot_type="bar")
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "survey_feature_importance",
            "image": img_base64,
            "format": "png"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating survey feature importance plot: {str(e)}")

# Survey SHAP Dependence Plot (Optimized with cached data)
@app.get("/shap/survey/dependence")
def get_survey_dependence_plot(feature: str):
    """
    Get SHAP dependence plot for a specific survey feature.

    Args:
        feature: Feature name (use query parameter, e.g., ?feature=Work-Life Balance)
    """
    if survey_explainer is None or survey_sample_shap_values is None:
        raise HTTPException(status_code=503, detail="Survey SHAP explainer not initialized")

    try:
        # Find feature index
        if feature not in survey_feature_names:
            raise HTTPException(status_code=404, detail=f"Feature '{feature}' not found. Available features: {survey_feature_names[:5]}...")

        feature_idx = survey_feature_names.index(feature)

        # Use pre-computed SHAP values
        shap_values = survey_sample_shap_values
        X_sample = survey_sample_X

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 6))
        shap.dependence_plot(feature_idx, shap_values, X_sample,
                            feature_names=survey_feature_display_names, show=False, ax=ax)
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "survey_dependence",
            "feature": feature,
            "display_name": survey_feature_display_names[feature_idx],
            "image": img_base64,
            "format": "png"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating survey dependence plot: {str(e)}")

# Duplicate/corrupted survey force and dependence endpoints removed.
# The correct implementations are defined earlier in this file.
# This placeholder prevents duplicated/invalid handlers from causing runtime errors.

# Survey SHAP Waterfall Plot
@app.post("/shap/survey/waterfall")
def get_survey_waterfall_plot(data: Dict[str, Any]):
    if survey_explainer is None:
        raise HTTPException(status_code=503, detail="Survey SHAP explainer not initialized")

    try:
        # Extract and store employee ID before processing
        employee_id = data.get("Employee ID", data.get("employee_id", "Unknown"))

        # Convert dict to DataFrame
        df = pd.DataFrame([data])

        # Drop only the columns that weren't present during training
        # Keep all the actual survey feature columns!
        columns_to_drop = ['Employee ID', 'Full Name', 'Attrition_Prob', 'Attrition']
        df = df.drop(columns=[col for col in columns_to_drop if col in df.columns])

        # Transform data - survey pipeline uses 'scaler' instead of 'preprocessor'
        scaler = survey_pipeline.named_steps['scaler']
        X = scaler.transform(df)

        # Get prediction using classifier step
        model = survey_pipeline.named_steps['classifier']
        prediction = model.predict_proba(X)[0, 1]

        # Calculate SHAP values
        shap_values = survey_explainer.shap_values(X)

        # Get base value
        base_value = survey_explainer.expected_value

        # Create waterfall plot
        fig, ax = plt.subplots(figsize=(12, 8))

        # Get SHAP values for this instance
        shap_vals = shap_values[0]

        # Create explanation object for waterfall plot with display names
        explanation = shap.Explanation(
            values=shap_vals,
            base_values=base_value,
            data=X[0],
            feature_names=survey_feature_display_names
        )

        # Generate waterfall plot
        shap.plots.waterfall(explanation, show=False)
        plt.tight_layout()

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return {
            "plot_type": "survey_waterfall",
            "employee_id": employee_id,
            "image": img_base64,
            "format": "png",
            "base_value": float(base_value),
            "prediction": float(prediction)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating survey waterfall plot: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
