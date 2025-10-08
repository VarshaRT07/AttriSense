import express from "express";
import { generatePDFReport } from "../controllers/reportController.js";

const router = express.Router();

// Generate PDF report
router.get("/generate-pdf", generatePDFReport);

export default router;
