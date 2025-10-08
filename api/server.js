import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Import routes
import analyticsRoutes from "./routes/analyticsRoutes.js";
import attritionScoreRoutes from "./routes/attritionScoreRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import pulseSurveyRoutes from "./routes/pulseSurveyRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

// Import middleware
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
} from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "HR Attrition API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/pulse-surveys", pulseSurveyRoutes);
app.use("/api/attrition-scores", attritionScoreRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "AttriSense API - AI-Powered Attrition Intelligence",
    version: "1.0.0",
    endpoints: {
      employees: {
        base: "/api/employees",
        methods: ["GET", "POST", "PUT", "DELETE"],
        endpoints: [
          "GET /api/employees - Get all employees",
          "GET /api/employees/:id - Get employee by ID",
          "GET /api/employees/department/:department - Get employees by department",
          "GET /api/employees/attrition/:status - Get employees by attrition status",
          "GET /api/employees/stats - Get employee statistics",
          "GET /api/employees/stats/departments - Get department statistics",
          "POST /api/employees - Create new employee",
          "POST /api/employees/bulk - Create new employees",
          "GET /api/employees/export - export",
          "PUT /api/employees/:id - Update employee",
          "DELETE /api/employees/:id - Delete employee",
        ],
      },
      pulseSurveys: {
        base: "/api/pulse-surveys",
        methods: ["GET", "POST", "PUT", "DELETE"],
        endpoints: [
          "GET /api/pulse-surveys - Get all pulse surveys",
          "GET /api/pulse-surveys/:id - Get pulse survey by ID",
          "GET /api/pulse-surveys/employee/:employeeId - Get surveys by employee",
          "GET /api/pulse-surveys/latest - Get latest surveys for all employees",
          "GET /api/pulse-surveys/stats - Get pulse survey statistics",
          "GET /api/pulse-surveys/stats/departments - Get department survey stats",
          "POST /api/pulse-surveys - Create new pulse survey",
          "POST /api/pulse-surveys/bulk - Create new pulse survey",
          "GET /api/pulse-surveys/export - export",
          "PUT /api/pulse-surveys/:id - Update pulse survey",
          "DELETE /api/pulse-surveys/:id - Delete pulse survey",
        ],
      },
      attritionScores: {
        base: "/api/attrition-scores",
        methods: ["GET", "POST", "PUT", "DELETE"],
        endpoints: [
          "GET /api/attrition-scores - Get all attrition scores",
          "GET /api/attrition-scores/:id - Get attrition score by ID",
          "GET /api/attrition-scores/employee/:employeeId - Get scores by employee",
          "GET /api/attrition-scores/latest - Get latest scores for all employees",
          "GET /api/attrition-scores/risk/:riskLevel - Get scores by risk level",
          "GET /api/attrition-scores/stats - Get attrition score statistics",
          "GET /api/attrition-scores/stats/departments - Get department attrition stats",
          "GET /api/attrition-scores/stats/model-performance - Get model performance",
          "POST /api/attrition-scores - Create new attrition score",
          "PUT /api/attrition-scores/:id - Update attrition score",
          "DELETE /api/attrition-scores/:id - Delete attrition score",
        ],
      },
      analytics: {
        base: "/api/analytics",
        methods: ["GET"],
        endpoints: [
          "GET /api/analytics/dashboard - Get comprehensive dashboard analytics",
          "GET /api/analytics/employee/:employeeId - Get employee detailed analytics",
          "GET /api/analytics/high-risk-employees - Get high-risk employees with details",
          "GET /api/analytics/predictive-insights - Get predictive insights and correlations",
        ],
      },
    },
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 HR Attrition API Server running on port ${PORT}`);
  console.log(`📊 API Documentation available at http://localhost:${PORT}/api`);
});
