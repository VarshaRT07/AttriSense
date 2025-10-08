import express from "express";
import {
  createAttritionScore,
  createAttritionScoresBulk,
  deleteAttritionScore,
  getAllAttritionScores,
  getAttritionScoreById,
  getAttritionScoresByEmployee,
  getAttritionScoresByRisk,
  getAttritionScoreStats,
  getDepartmentAttritionStats,
  getLatestAttritionScores,
  getModelPerformance,
  updateAttritionScore,
} from "../controllers/attritionScoreController.js";
import { validateAttritionScore, validateAttritionScoreBulk } from "../middleware/validation.js";

const router = express.Router();

// GET routes
router.get("/", getAllAttritionScores);
router.get("/latest", getLatestAttritionScores);
router.get("/stats", getAttritionScoreStats);
router.get("/stats/departments", getDepartmentAttritionStats);
router.get("/stats/model-performance", getModelPerformance);
router.get("/risk/:riskLevel", getAttritionScoresByRisk);
router.get("/employee/:employeeId", getAttritionScoresByEmployee);
router.get("/:id", getAttritionScoreById);

// POST routes
router.post("/", validateAttritionScore, createAttritionScore);

router.post("/bulk", validateAttritionScoreBulk, createAttritionScoresBulk);


// PUT routes
router.put("/:id", validateAttritionScore, updateAttritionScore);

// DELETE routes
router.delete("/:id", deleteAttritionScore);

export default router;
