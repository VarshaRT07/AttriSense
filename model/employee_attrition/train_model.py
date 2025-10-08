import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, OrdinalEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.metrics import precision_recall_curve, average_precision_score
from xgboost import XGBClassifier
import joblib
import time
import shap
import matplotlib.pyplot as plt

start = time.time()

df = pd.read_csv("synthetic_employee_dataset.csv")

# Target
y = df["Attrition"]

# Drop columns not useful for prediction
X = df.drop(columns=["Employee ID", "Full Name", "Attrition", "Attrition_Prob"])

# Feature groups
numeric_features = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
categorical_features = X.select_dtypes(include=["object"]).columns.tolist()
feature_names = numeric_features + categorical_features

preprocessor = ColumnTransformer(
    transformers=[
        ("num", "passthrough", numeric_features),
        (
            "cat",
            OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1),
            categorical_features,
        ),
    ]
)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=45
)

xgb_pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
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

xgb_pipeline.fit(X_train, y_train)
y_pred = xgb_pipeline.predict(X_test)
y_prob = xgb_pipeline.predict_proba(X_test)[:, 1]

print("XGBoost (with preprocessing):")
print(classification_report(y_test, y_pred))
print("ROC-AUC:", roc_auc_score(y_test, y_prob))
print("PR-AUC:", average_precision_score(y_test, y_prob))

joblib.dump(xgb_pipeline, "xgb_pipeline.joblib")

end = time.time()  # Record end time
print(f"Execution time: {end - start:.6f} seconds")


# --- SHAP Integration ---
print("\nCalculating SHAP values...")

# Get preprocessed training data
# X_train_enc = preprocessor.fit_transform(X_train)
X_test_enc = preprocessor.transform(X_test.head(150))

# Get trained XGB model
xgb_model = xgb_pipeline.named_steps["classifier"]

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
shap.dependence_plot("Salary", shap_values, X_test_enc, feature_names=feature_names)
# interaction_index="Tenure"
plt.savefig("shap_dependence.png", bbox_inches="tight")
plt.close()
shap.summary_plot(
    shap_values, X_test_enc, feature_names=feature_names, plot_type="violin"
)
plt.savefig("shap_violin.png", bbox_inches="tight")
plt.close()


# # Suppose you only want these features
# selected_features = ["Salary", "Tenure", "Age", "JobSatisfaction"]

# # Get indices of these features
# feature_indices = [feature_names.index(f) for f in selected_features]

# # Subset SHAP values and data
# shap_values_subset = shap_values[:, feature_indices]  # assuming shap_values is 2D array
# X_test_subset = X_test_enc[:, feature_indices]

# # Plot summary for selected features only
# shap.summary_plot(
#     shap_values_subset,
#     X_test_subset,
#     feature_names=selected_features,
#     plot_type="bar",
#     show=False
# )
# plt.savefig("shap_summary_selected_features.png", bbox_inches="tight")
# plt.close()
