import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib
import shap
import numpy as np
import matplotlib.pyplot as plt
from sklearn.pipeline import Pipeline

# Load datasetpy
df = pd.read_csv("synthetic_employee_survey_dataset.csv")

# Target
y = df["Attrition"]

# Drop columns not useful for prediction
X = df.drop(columns=["Employee ID", "Full Name", "Attrition", "Attrition_Prob"])

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- Pipeline: scaling + XGBoost ---
pipeline = Pipeline(
    [
        ("scaler", StandardScaler()),
        (
            "classifier",
            XGBClassifier(
                n_estimators=1000,
                learning_rate=0.05,
                max_depth=6,
                reg_alpha=0.1,
                reg_lambda=1.0,
                min_child_weight=5,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),
                n_jobs=-1,
                tree_method="hist",
            ),
        ),
    ]
)

# --- Train model ---
pipeline.fit(X_train, y_train)

# --- Predict and evaluate ---
y_pred = pipeline.predict(X_test)

# Evaluate
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print("Classification Report:")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(pipeline, "xgb_survey_pipeline.joblib")


# --- SHAP Integration ---
print("\nCalculating SHAP values...")
feature_names = X.columns.tolist()

# Get preprocessed training data
# X_train_enc = preprocessor.fit_transform(X_train)
X_test_enc = pipeline.named_steps["scaler"].transform(X_test.head(150))

# Get trained XGB model
xgb_model = pipeline.named_steps["classifier"]

# Use SHAP TreeExplainer
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test_enc)

# SHAP summary plot (feature importance)
shap.summary_plot(shap_values, X_test_enc, feature_names=feature_names)
plt.savefig("shap_summary_plot.png", bbox_inches="tight")
plt.close()

shap.summary_plot(shap_values, X_test_enc, feature_names=feature_names, plot_type="bar")
plt.savefig("shap_bar.png", bbox_inches="tight")
plt.close()
shap.dependence_plot(
    "Job Satisfaction", shap_values, X_test_enc, feature_names=feature_names
)
# interaction_index="Tenure"
plt.savefig("shap_dependence.png", bbox_inches="tight")
plt.close()
shap.summary_plot(
    shap_values, X_test_enc, feature_names=feature_names, plot_type="violin"
)
plt.savefig("shap_violin.png", bbox_inches="tight")
plt.close()
