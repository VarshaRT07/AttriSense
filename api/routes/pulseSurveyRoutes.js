import express from "express";
import {
  createPulseSurvey,
  getAllPulseSurveysExport,
  createPulseSurveysBulkHandler,
  deletePulseSurvey,
  getAllPulseSurveys,
  getDepartmentPulseSurveyStats,
  getLatestPulseSurveys,
  getPulseSurveyById,
  getPulseSurveysByEmployee,
  getPulseSurveyStats,
  updatePulseSurvey,
} from "../controllers/pulseSurveyController.js";

const router = express.Router();

// Get all pulse surveys
router.get("/", getAllPulseSurveys);

router.get("/export", getAllPulseSurveysExport);


// Get pulse survey statistics
router.get("/stats", getPulseSurveyStats);

// Get department pulse survey statistics
router.get("/department-stats", getDepartmentPulseSurveyStats);

// Get latest pulse surveys
router.get("/latest", getLatestPulseSurveys);

// Get pulse survey by ID
router.get("/:id", getPulseSurveyById);

// Get pulse surveys by employee
router.get("/employee/:employeeId", getPulseSurveysByEmployee);

// Create pulse survey
router.post("/", createPulseSurvey);

router.post("/bulk", createPulseSurveysBulkHandler);


// Update pulse survey
router.put("/:id", updatePulseSurvey);

// Delete pulse survey
router.delete("/:id", deletePulseSurvey);

export default router;
