from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import joblib
import pandas as pd
import shap

app = FastAPI()

# Load model
e_pipeline = joblib.load("xgb_pipeline.joblib")
preprocessor = e_pipeline.named_steps["preprocessor"]
s_pipeline = joblib.load("xgb_survey_pipeline.joblib")
scaler = s_pipeline.named_steps["scaler"]

# Extract the classifier
e_model = e_pipeline.named_steps["classifier"]
s_model = s_pipeline.named_steps["classifier"]

# Prepare SHAP explainer
e_explainer = shap.TreeExplainer(e_model)
s_explainer = shap.TreeExplainer(s_model)

# Features and ID columns
e_feature_names = preprocessor.feature_names_in_.tolist()
s_feature_names = [
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

id_cols = ["Employee ID", "Full Name"]


# Pydantic model
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
    No_of_companies_worked_previously: int = Field(
        ..., alias="No. of companies worked previously"
    )
    LeavesTaken: int = Field(..., alias="LeavesTaken")
    YearsWithCompany: int = Field(..., alias="YearsWithCompany")

    class Config:
        allow_population_by_field_name = True
        validate_assignment = True

class SurveyDetails(BaseModel):
    EmployeeID: Optional[int] = Field(None, alias="Employee ID")
    FullName: Optional[str] = Field(None, alias="Full Name")

    # survey
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

# Helper function to convert records to DataFrame
def prepare_df(records: List[AttritionRecord]) -> pd.DataFrame:
    data = [r.dict(by_alias=True) for r in records]
    df = pd.DataFrame(data)
    return df

# Helper function to convert records to DataFrame
def prepare_survey_df(records: List[SurveyDetails]) -> pd.DataFrame:
    data = [r.dict(by_alias=True) for r in records]
    df = pd.DataFrame(data)
    return df

# Single prediction endpoint
@app.post("/predict")
def survey_predict(record: AttritionRecord):
    try:
        df = prepare_df([record])
        ids = df[id_cols].iloc[0]

        # Preprocess
        features = df[e_feature_names]
        X_scaled = preprocessor.transform(features)

        # Predict
        proba = e_model.predict_proba(X_scaled)[0, 1]

        # SHAP
        shap_values = e_explainer.shap_values(X_scaled)
        contrib_pairs = list(zip(e_feature_names, shap_values[0]))

        positive = sorted(
            [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
        )[:3]
        negative = sorted([p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1])[
            :3
        ]

        return {
            "Employee ID": str(ids["Employee ID"]),
            "Full Name": str(ids["Full Name"]),
            "attrition_probability": float(proba),
            "top_positive_contributors": [
                {"feature": f, "contribution": float(c)} for f, c in positive
            ],
            "top_negative_contributors": [
                {"feature": f, "contribution": float(c)} for f, c in negative
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Batch prediction endpoint
@app.post("/predict_batch")
def survey_predict_batch(records: List[AttritionRecord]):
    try:
        df = prepare_df(records)
        ids_df = df[id_cols]

        # Preprocess
        features = df[e_feature_names]
        X_scaled = preprocessor.transform(features)

        # Predict
        proba_all = e_model.predict_proba(X_scaled)[:, 1]

        # SHAP
        shap_values_all = e_explainer.shap_values(X_scaled)
        results = []

        for i in range(len(records)):
            contrib_pairs = list(zip(e_feature_names, shap_values_all[i]))
            positive = sorted(
                [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
            )[:3]
            negative = sorted(
                [p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1]
            )[:3]

            results.append(
                {
                    "Employee ID": str(ids_df.iloc[i]["Employee ID"]),
                    "Full Name": str(ids_df.iloc[i]["Full Name"]),
                    "attrition_probability": float(proba_all[i]),
                    "top_positive_contributors": [
                        {"feature": f, "contribution": float(c)} for f, c in positive
                    ],
                    "top_negative_contributors": [
                        {"feature": f, "contribution": float(c)} for f, c in negative
                    ],
                }
            )

        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/survey_predict")
def survey_predict(record: SurveyDetails):
    try:
        df = prepare_survey_df([record])
        ids = df[["Employee ID", "Full Name"]].iloc[0]
        features = df[s_feature_names]
        scaled = scaler.transform(features)

        proba = s_model.predict_proba(scaled)[0, 1]
        shap_values = s_explainer(scaled)
        contrib_pairs = list(zip(s_feature_names, shap_values.values[0]))

        positive = sorted(
            [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
        )[:3]
        negative = sorted([p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1])[
            :3
        ]

        return {
            "Employee ID": str(ids["Employee ID"]),
            "Full Name": str(ids["Full Name"]),
            # "Age": int(ids["Age"]),
            "attrition_probability": float(proba),
            "top_positive_contributors": [
                {"feature": f, "contribution": float(c)} for f, c in positive
            ],
            "top_negative_contributors": [
                {"feature": f, "contribution": float(c)} for f, c in negative
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/survey_predict_batch")
def survey_predict_batch(records: List[SurveyDetails]):
    try:
        df = prepare_survey_df(records)
        ids_df = df[["Employee ID", "Full Name"]]
        features = df[s_feature_names]
        scaled = scaler.transform(features)
        proba_all = s_model.predict_proba(scaled)[:, 1]
        shap_vals_all = s_explainer(scaled)

        results = []
        for i in range(len(records)):
            contrib_pairs = list(zip(s_feature_names, shap_vals_all.values[i]))
            positive = sorted(
                [p for p in contrib_pairs if p[1] > 0], key=lambda x: x[1], reverse=True
            )[:3]
            negative = sorted(
                [p for p in contrib_pairs if p[1] < 0], key=lambda x: x[1]
            )[:3]

            results.append(
                {
                    "Employee ID": str(ids_df.iloc[i]["Employee ID"]),
                    "Full Name": str(ids_df.iloc[i]["Full Name"]),
                    # "Age": int(ids_df.iloc[i]["Age"]),
                    "attrition_probability": float(proba_all[i]),
                    "top_positive_contributors": [
                        {"feature": f, "contribution": float(c)} for f, c in positive
                    ],
                    "top_negative_contributors": [
                        {"feature": f, "contribution": float(c)} for f, c in negative
                    ],
                }
            )
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
