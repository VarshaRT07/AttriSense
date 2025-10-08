import pool from "../config/database.js";

// Get all pulse surveys with pagination, filtering, and sorting
export const getAllPulseSurveys = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      employee_id,
      search,
      sort_by = "survey_id",
      sort_order = "asc",
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      whereClause += ` AND e.department = $${paramCount}`;
      params.push(department);
    }

    if (employee_id) {
      paramCount++;
      whereClause += ` AND ps.employee_id = $${paramCount}`;
      params.push(employee_id);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (e.full_name ILIKE $${paramCount} OR e.job_role ILIKE $${paramCount} OR e.department ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Validate sort_by to prevent SQL injection
    const validSortFields = [
      "survey_id",
      "survey_date",
      "full_name",
      "department",
      "job_role",
      "overall_engagement",
      "job_satisfaction",
      "work_life_balance",
    ];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by === "full_name" ||
        sort_by === "department" ||
        sort_by === "job_role"
        ? `e.${sort_by}`
        : `ps.${sort_by}`
      : "ps.survey_date";
    const sortOrder = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Get total count
    const countQuery = `
      SELECT COUNT(*)
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalSurveys = parseInt(countResult.rows[0].count);

    // Get surveys with pagination + sorting
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const query = `
      SELECT
        ps.*,
        e.full_name,
        e.department,
        e.job_role
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    res.json({
      surveys: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSurveys / limit),
        totalSurveys,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching pulse surveys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPulseSurveysExport = async (req, res) => {
  try {
    const query = `
      SELECT
        ps.*,
        e.full_name,
        e.department,
        e.job_role
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      ORDER BY ps.survey_date DESC
    `;

    const result = await pool.query(query);

    res.json({
      survey: result.rows,
    });
  } catch (error) {
    console.error("Error fetching all pulse surveys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pulse survey by ID
export const getPulseSurveyById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ps.*,
        e.full_name,
        e.department,
        e.job_role
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      WHERE ps.survey_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pulse survey not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching pulse survey:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pulse surveys by employee
export const getPulseSurveysByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const query = `
      SELECT 
        ps.*,
        e.full_name,
        e.department,
        e.job_role
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      WHERE ps.employee_id = $1
      ORDER BY ps.survey_date DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [employeeId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching employee pulse surveys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get latest pulse surveys
export const getLatestPulseSurveys = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (ps.employee_id)
        ps.*,
        e.full_name,
        e.department,
        e.job_role
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      ORDER BY ps.employee_id, ps.survey_date DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching latest pulse surveys:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pulse survey statistics
export const getPulseSurveyStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_responses,
        ROUND(AVG(job_satisfaction), 2) as avg_job_satisfaction,
        ROUND(AVG(work_life_balance), 2) as avg_work_life_balance,
        ROUND(AVG(career_growth), 2) as avg_career_growth,
        ROUND(AVG(compensation_satisfaction), 2) as avg_compensation_satisfaction,
        ROUND(AVG(management_satisfaction), 2) as avg_management_satisfaction,
        ROUND(AVG(team_collaboration), 2) as avg_team_collaboration,
        ROUND(AVG(workload_stress), 2) as avg_workload_stress,
        ROUND(AVG(recognition), 2) as avg_recognition,
        ROUND(AVG(learning_opportunities), 2) as avg_learning_opportunities,
        ROUND(AVG(overall_engagement), 2) as avg_engagement,
        ROUND(AVG(likelihood_to_recommend), 2) as avg_likelihood_to_recommend
      FROM pulse_surveys
    `;

    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching pulse survey stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get department pulse survey statistics
export const getDepartmentPulseSurveyStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.department,
        COUNT(*) as total_responses,
        ROUND(AVG(ps.job_satisfaction), 2) as avg_job_satisfaction,
        ROUND(AVG(ps.work_life_balance), 2) as avg_work_life_balance,
        ROUND(AVG(ps.career_growth), 2) as avg_career_growth,
        ROUND(AVG(ps.compensation_satisfaction), 2) as avg_compensation_satisfaction,
        ROUND(AVG(ps.management_satisfaction), 2) as avg_management_satisfaction,
        ROUND(AVG(ps.team_collaboration), 2) as avg_team_collaboration,
        ROUND(AVG(ps.workload_stress), 2) as avg_workload_stress,
        ROUND(AVG(ps.recognition), 2) as avg_recognition,
        ROUND(AVG(ps.learning_opportunities), 2) as avg_learning_opportunities,
        ROUND(AVG(ps.overall_engagement), 2) as avg_engagement,
        ROUND(AVG(ps.likelihood_to_recommend), 2) as avg_likelihood_to_recommend
      FROM pulse_surveys ps
      JOIN employees e ON ps.employee_id = e.employee_id
      WHERE e.department IS NOT NULL
      GROUP BY e.department
      ORDER BY e.department
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching department pulse survey stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create pulse survey
export const createPulseSurvey = async (req, res) => {
  try {
    const {
      employee_id,
      job_satisfaction,
      work_life_balance,
      career_growth,
      compensation_satisfaction,
      management_satisfaction,
      team_collaboration,
      workload_stress,
      recognition,
      learning_opportunities,
      overall_engagement,
      likelihood_to_recommend,
      comments,
    } = req.body;

    const query = `
      INSERT INTO pulse_surveys (
        employee_id, job_satisfaction, work_life_balance, career_growth,
        compensation_satisfaction, management_satisfaction, team_collaboration,
        workload_stress, recognition, learning_opportunities, overall_engagement,
        likelihood_to_recommend, comments, survey_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE
      ) RETURNING *
    `;

    const values = [
      employee_id,
      job_satisfaction,
      work_life_balance,
      career_growth,
      compensation_satisfaction,
      management_satisfaction,
      team_collaboration,
      workload_stress,
      recognition,
      learning_opportunities,
      overall_engagement,
      likelihood_to_recommend,
      comments,
    ];

    const result = await pool.query(query, values);
    res.status(201).json({
      message: "Pulse survey created successfully",
      survey: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating pulse survey:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createPulseSurveysBulkHandler = async (req, res) => {
  try {
    const surveysArray = req.body;

    if (!Array.isArray(surveysArray) || surveysArray.length === 0) {
      return res.status(400).json({ error: "Input must be a non-empty array" });
    }

    const values = [];
    // Total number of fields sent per survey record is 25 including survey_date as CURRENT_DATE
    const placeholders = surveysArray
      .map((survey, i) => {
        const base = i * 25;

        values.push(
          survey["Employee ID"],
          survey["Full Name"],
          survey["Work-Life Balance"],
          survey["Job Satisfaction"],
          survey["Relationship with Manager"],
          survey["Communication effectiveness"],
          survey["Recognition and Reward Satisfaction"],
          survey["Career growth and advancement opportunities"],
          survey["Alignment with Company Values/Mission"],
          survey["Perceived fairness"],
          survey["Team cohesion and peer support"],
          survey["Autonomy at work"],
          survey["Overall engagement"],
          survey["Training and skill development satisfaction"],
          survey["Stress levels/work pressure"],
          survey["Organizational change readiness"],
          survey["Feedback frequency and usefulness"],
          survey["Flexibility support"],
          survey["Conflict at work"],
          survey["Perceived job security"],
          survey["Environment satisfaction"],
          // survey_date is CURRENT_DATE in SQL, so no value here
          survey.attrition_probability || 0.5,
          survey.attrition,
          JSON.stringify(survey.top_positive_contributors || []),
          JSON.stringify(survey.top_negative_contributors || [])
        );

        // 1-based indexing of placeholders with survey_date as CURRENT_DATE (no placeholder)
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
          base + 5
        }, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${
          base + 10
        }, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${
          base + 15
        }, $${base + 16}, $${base + 17}, $${base + 18}, $${base + 19}, $${
          base + 20
        }, $${base + 21}, CURRENT_DATE, $${base + 22}, $${base + 23}, $${
          base + 24
        }, $${base + 25})`;
      })
      .join(", ");

    const query = `
      INSERT INTO pulse_surveys (
        employee_id,
        full_name,
        work_life_balance,
        job_satisfaction,
        relationship_with_manager,
        communication_effectiveness,
        recognition_reward_sat,
        career_growth_opportunities,
        alignment_with_company_values,
        perceived_fairness,
        team_cohesion_support,
        autonomy_at_work,
        overall_engagement,
        training_skill_dev_sat,
        stress_levels,
        org_change_readiness,
        feedback_usefulness,
        flexibility_support,
        conflict_at_work,
        perceived_job_security,
        environment_satisfaction,
        survey_date,
        attrition_score,
        attrition,
        top_positive_contributors,
        top_negative_contributors
      )
      VALUES ${placeholders}
      ON CONFLICT (employee_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        work_life_balance = EXCLUDED.work_life_balance,
        job_satisfaction = EXCLUDED.job_satisfaction,
        relationship_with_manager = EXCLUDED.relationship_with_manager,
        communication_effectiveness = EXCLUDED.communication_effectiveness,
        recognition_reward_sat = EXCLUDED.recognition_reward_sat,
        career_growth_opportunities = EXCLUDED.career_growth_opportunities,
        alignment_with_company_values = EXCLUDED.alignment_with_company_values,
        perceived_fairness = EXCLUDED.perceived_fairness,
        team_cohesion_support = EXCLUDED.team_cohesion_support,
        autonomy_at_work = EXCLUDED.autonomy_at_work,
        overall_engagement = EXCLUDED.overall_engagement,
        training_skill_dev_sat = EXCLUDED.training_skill_dev_sat,
        stress_levels = EXCLUDED.stress_levels,
        org_change_readiness = EXCLUDED.org_change_readiness,
        feedback_usefulness = EXCLUDED.feedback_usefulness,
        flexibility_support = EXCLUDED.flexibility_support,
        conflict_at_work = EXCLUDED.conflict_at_work,
        perceived_job_security = EXCLUDED.perceived_job_security,
        environment_satisfaction = EXCLUDED.environment_satisfaction,
        survey_date = EXCLUDED.survey_date,
        attrition_score = EXCLUDED.attrition_score,
        attrition = EXCLUDED.attrition,
        top_positive_contributors = EXCLUDED.top_positive_contributors,
        top_negative_contributors = EXCLUDED.top_negative_contributors
      RETURNING survey_id, employee_id;
    `;

    const result = await pool.query(query, values);

    // Count how many were inserted vs updated
    const insertedCount = result.rows.filter((row, index) => {
      // If this is a new insert, the survey_id will be sequential from the last max
      return true; // We'll return all for now
    }).length;

    res.status(200).json({
      success: true,
      message: `Successfully processed ${result.rows.length} survey(s). Existing surveys were updated.`,
      total: result.rows.length,
      surveys: result.rows,
    });
  } catch (error) {
    console.error("Bulk pulse survey creation/update failed:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Update pulse survey
export const updatePulseSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove survey_id from updates if present
    delete updates.survey_id;

    const allowedFields = [
      "job_satisfaction",
      "work_life_balance",
      "career_growth",
      "compensation_satisfaction",
      "management_satisfaction",
      "team_collaboration",
      "workload_stress",
      "recognition",
      "learning_opportunities",
      "overall_engagement",
      "likelihood_to_recommend",
      "comments",
    ];

    const updateFields = Object.keys(updates).filter(
      (field) => allowedFields.includes(field) && updates[field] !== undefined
    );

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const setClause = updateFields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");
    const values = [id, ...updateFields.map((field) => updates[field])];

    const query = `
      UPDATE pulse_surveys 
      SET ${setClause}
      WHERE survey_id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pulse survey not found" });
    }

    res.json({
      message: "Pulse survey updated successfully",
      survey: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating pulse survey:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete pulse survey
export const deletePulseSurvey = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM pulse_surveys WHERE survey_id = $1 RETURNING *";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pulse survey not found" });
    }

    res.json({
      message: "Pulse survey deleted successfully",
      survey: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting pulse survey:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  getAllPulseSurveys,
  getPulseSurveyById,
  getPulseSurveysByEmployee,
  getLatestPulseSurveys,
  getPulseSurveyStats,
  getDepartmentPulseSurveyStats,
  createPulseSurvey,
  updatePulseSurvey,
  deletePulseSurvey,
};
