import express from "express";
import {
  createEmployee,
  createEmployeesBulkHandler,
  deleteEmployee,
  getAllEmployees,
  getAllEmployeesForExport,
  getAttritionRiskDistribution,
  getDepartmentStats,
  getEmployeeById,
  getEmployeeStats,
  updateEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

// Get all employees with pagination and filtering
router.get("/", getAllEmployees);
router.get("/export", getAllEmployeesForExport);
// Get employee statistics
router.get("/stats", getEmployeeStats);

// Get department statistics
router.get("/department-stats", getDepartmentStats);

// Get attrition risk distribution
router.get("/risk-distribution", getAttritionRiskDistribution);

// Get employee by ID
router.get("/:id", getEmployeeById);

// Create new employee
router.post("/", createEmployee);

// Create new employees
router.post("/bulk", createEmployeesBulkHandler);

// Update employee
router.put("/:id", updateEmployee);

// Delete employee
router.delete("/:id", deleteEmployee);

export default router;
