import pool from "../config/database.js";

// Get all attrition scores
export const getAllAttritionScores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ats.*,
        e.full_name,
        e.department,
        e.job_role,
        e.attrition
      FROM attrition_scores ats
      LEFT JOIN employees e ON ats.employee_id = e.employee_id
      ORDER BY ats.calculated_at DESC, ats.employee_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attrition scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attrition score by ID
export const getAttritionScoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT 
        ats.*,
        e.full_name,
        e.department,
        e.job_role,
        e.attrition
      FROM attrition_scores ats
      LEFT JOIN employees e ON ats.employee_id = e.employee_id
      WHERE ats.score_id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attrition score not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching attrition score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attrition scores by employee ID
export const getAttritionScoresByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await pool.query(
      `
      SELECT 
        ats.*,
        e.full_name,
        e.department,
        e.job_role,
        e.attrition
      FROM attrition_scores ats
      LEFT JOIN employees e ON ats.employee_id = e.employee_id
      WHERE ats.employee_id = $1
      ORDER BY ats.calculated_at DESC
    `,
      [employeeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attrition scores by employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get latest attrition scores for all employees
export const getLatestAttritionScores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (ats.employee_id)
        ats.*,
        e.full_name,
        e.department,
        e.job_role,
        e.attrition
      FROM attrition_scores ats
      LEFT JOIN employees e ON ats.employee_id = e.employee_id
      ORDER BY ats.employee_id, ats.calculated_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching latest attrition scores:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attrition scores by risk level
export const getAttritionScoresByRisk = async (req, res) => {
  try {
    const { riskLevel } = req.params;
    const result = await pool.query(
      `
      SELECT DISTINCT ON (ats.employee_id)
        ats.*,
        e.full_name,
        e.department,
        e.job_role,
        e.attrition
      FROM attrition_scores ats
      LEFT JOIN employees e ON ats.employee_id = e.employee_id
      WHERE ats.risk_level = $1
      ORDER BY ats.employee_id, ats.calculated_at DESC
    `,
      [riskLevel]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attrition scores by risk level:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attrition score statistics
export const getAttritionScoreStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_scores,
        COUNT(DISTINCT employee_id) as unique_employees,
        COUNT(CASE WHEN risk_level = 'High' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN risk_level = 'Medium' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN risk_level = 'Low' THEN 1 END) as low_risk_count,
        ROUND(AVG(base_score), 3) as avg_base_score,
        ROUND(AVG(pulse_score), 3) as avg_pulse_score,
        ROUND(AVG(combined_score), 3) as avg_combined_score,
        ROUND(MIN(combined_score), 3) as min_combined_score,
        ROUND(MAX(combined_score), 3) as max_combined_score
      FROM (
        SELECT DISTINCT ON (employee_id) *
        FROM attrition_scores
        ORDER BY employee_id, calculated_at DESC
      ) latest_scores
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching attrition score stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get department-wise attrition score statistics
export const getDepartmentAttritionStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.department,
        COUNT(ats.*) as total_scores,
        COUNT(DISTINCT ats.employee_id) as unique_employees,
        COUNT(CASE WHEN ats.risk_level = 'High' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN ats.risk_level = 'Medium' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN ats.risk_level = 'Low' THEN 1 END) as low_risk_count,
        ROUND(AVG(ats.base_score), 3) as avg_base_score,
        ROUND(AVG(ats.pulse_score), 3) as avg_pulse_score,
        ROUND(AVG(ats.combined_score), 3) as avg_combined_score,
        ROUND((COUNT(CASE WHEN ats.risk_level = 'High' THEN 1 END) * 100.0 / COUNT(ats.*)), 2) as high_risk_percentage
      FROM (
        SELECT DISTINCT ON (employee_id) *
        FROM attrition_scores
        ORDER BY employee_id, calculated_at DESC
      ) ats
      LEFT JOIN employees e ON ats.employee_id = e.employee_id
      WHERE e.department IS NOT NULL
      GROUP BY e.department
      ORDER BY high_risk_percentage DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching department attrition stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get model performance metrics
export const getModelPerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        model_version,
        COUNT(*) as prediction_count,
        COUNT(DISTINCT employee_id) as unique_employees,
        ROUND(AVG(base_score), 3) as avg_base_score,
        ROUND(AVG(pulse_score), 3) as avg_pulse_score,
        ROUND(AVG(combined_score), 3) as avg_combined_score,
        COUNT(CASE WHEN risk_level = 'High' THEN 1 END) as high_risk_predictions,
        MIN(calculated_at) as first_prediction,
        MAX(calculated_at) as latest_prediction
      FROM attrition_scores
      GROUP BY model_version
      ORDER BY latest_prediction DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching model performance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new attrition score
export const createAttritionScore = async (req, res) => {
  try {
    const {
      employee_id,
      model_version,
      base_score,
      pulse_score,
      combined_score,
      risk_level,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO attrition_scores (
        employee_id, model_version, base_score, pulse_score, combined_score, risk_level
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `,
      [
        employee_id,
        model_version,
        base_score,
        pulse_score,
        combined_score,
        risk_level,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating attrition score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAttritionScoresBulk = async (req, res) => {
  try {
    const scoresArray = req.body;

    if (!Array.isArray(scoresArray) || scoresArray.length === 0) {
      return res.status(400).json({ error: "Request body must be a non-empty array" });
    }

    const values = [];
    const placeholders = scoresArray.map((score, i) => {
      const base = i * 6; // six columns per row
      values.push(
        score.employee_id,
        score.model_version,
        score.base_score,
        score.pulse_score,
        score.combined_score,
        score.risk_level
      );

      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    }).join(", ");

    const query = `
      INSERT INTO attrition_scores (
        employee_id, model_version, base_score, pulse_score, combined_score, risk_level
      )
      VALUES ${placeholders}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    res.status(201).json(result.rows);
  } catch (error) {
    console.error("Error creating attrition scores bulk:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Update attrition score
export const updateAttritionScore = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = [id, ...Object.values(updates)];

    const result = await pool.query(
      `
      UPDATE attrition_scores 
      SET ${setClause}
      WHERE score_id = $1 
      RETURNING *
    `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attrition score not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating attrition score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete attrition score
export const deleteAttritionScore = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM attrition_scores WHERE score_id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attrition score not found" });
    }

    res.json({
      message: "Attrition score deleted successfully",
      score: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting attrition score:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
