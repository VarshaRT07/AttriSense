import express from "express";
import {
  getAttritionTrends,
  getDashboardAnalytics,
  getDepartmentComparison,
  getEmployeeSegmentation,
  getPredictiveInsights,
  getEmployeeAnalytics,
  getShapAnalysis,
  getTimeTrends,
  getDepartmentDeepDive,
  getRetentionRecommendations,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Dashboard analytics
router.get("/dashboard", getDashboardAnalytics);

// Attrition trends
router.get("/attrition-trends", getAttritionTrends);

// Department comparison
router.get("/department-comparison", getDepartmentComparison);

// Employee segmentation
router.get("/employee-segmentation", getEmployeeSegmentation);

// Predictive insights
router.get("/predictive-insights", getPredictiveInsights);

// Employee detailed analytics
router.get("/employee/:employeeId", getEmployeeAnalytics);

// SHAP analysis
router.get("/shap", getShapAnalysis);

// Time-based trends
router.get("/trends", getTimeTrends);

// Department deep dive
router.get("/department/:department/details", getDepartmentDeepDive);

// Retention recommendations
router.get("/recommendations/:employeeId", getRetentionRecommendations);

export default router;
