import pool from "../config/database.js";

export const getAllEmployeesForExport = async (req, res) => {
  try {
    // Use similar filtering logic if needed; or remove for full export without filters
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    // You can add filtering from req.query like department, working_model, attrition_risk, search as in getAllEmployees
    // Or to simplify export, fetch all rows without filters or pagination

    const query = `SELECT * FROM employees ${whereClause} ORDER BY employee_id ASC`;

    const result = await pool.query(query, params);

    res.json({
      employees: result.rows,
    });
  } catch (error) {
    console.error("Error exporting employees:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      working_model,
      attrition_risk,
      search,
      sort_by = "employee_id",
      sort_order = "asc",
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      whereClause += ` AND department = $${paramCount}`;
      params.push(department);
    }

    if (working_model) {
      paramCount++;
      whereClause += ` AND working_model = $${paramCount}`;
      params.push(working_model);
    }

    if (attrition_risk) {
      if (attrition_risk === "high") {
        paramCount++;
        whereClause += ` AND attrition_score > $${paramCount}`;
        params.push(0.7);
      } else if (attrition_risk === "medium") {
        paramCount++;
        whereClause += ` AND attrition_score BETWEEN $${paramCount} AND $${
          paramCount + 1
        }`;
        params.push(0.4, 0.7);
        paramCount++;
      } else if (attrition_risk === "low") {
        paramCount++;
        whereClause += ` AND attrition_score < $${paramCount}`;
        params.push(0.4);
      }
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (full_name ILIKE $${paramCount} OR job_role ILIKE $${paramCount} OR department ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Validate sort_by to prevent SQL injection
    const validSortFields = [
      "employee_id",
      "full_name",
      "department",
      "attrition_score",
      "salary",
      "years_of_experience",
    ];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "employee_id";
    const sortOrder = sort_order.toLowerCase() === "desc" ? "DESC" : "ASC";

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM employees ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalEmployees = parseInt(countResult.rows[0].count);

    // Get employees with pagination + sorting
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const query = `
      SELECT *
      FROM employees
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    res.json({
      employees: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEmployees / limit),
        totalEmployees,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get employee statistics
export const getEmployeeStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN attrition = 0 THEN 1 END) as active_employees,
        COUNT(CASE WHEN attrition = 1 THEN 1 END) as attrited_employees,
        ROUND(COUNT(CASE WHEN attrition = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as attrition_rate,
        ROUND(AVG(salary), 2) as avg_salary,
        ROUND(AVG(age), 1) as avg_age,
        ROUND(AVG(years_with_company), 1) as avg_tenure,
        ROUND(AVG(performance_rating), 2) as avg_performance,
        COUNT(CASE WHEN attrition_score > 0.7 THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN attrition_score BETWEEN 0.4 AND 0.7 THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN attrition_score < 0.4 THEN 1 END) as low_risk_count
      FROM employees
    `;

    const result = await pool.query(statsQuery);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching employee stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT *
      FROM employees 
      WHERE employee_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new employee
export const createEmployee = async (req, res) => {
  try {
    console.log(
      "Received create employee request:",
      JSON.stringify(req.body, null, 2)
    );

    const {
      employee_id,
      full_name,
      age,
      gender,
      years_of_experience,
      job_role,
      salary,
      performance_rating,
      number_of_promotions,
      overtime,
      commuting_distance,
      education_level,
      marital_status,
      number_of_dependents,
      job_level,
      last_hike,
      years_in_current_role,
      working_model,
      working_hours,
      department,
      no_of_companies_worked_previously,
      leaves_taken,
      years_with_company,
      attrition_score,
      attrition,
      top_positive_contributors,
      top_negative_contributors,
    } = req.body;

    // Map gender from full name to code
    const mapGender = (genderValue) => {
      if (!genderValue) return null;
      const genderMap = {
        Male: "M",
        Female: "F",
        M: "M",
        F: "F",
        O: "O",
      };
      return genderMap[genderValue] || null;
    };

    // Map working model to match database constraint
    const mapWorkingModel = (model) => {
      if (!model) return null;
      const modelMap = {
        Remote: "Remote",
        Hybrid: "Hybrid",
        "On-site": "Onsite",
        Onsite: "Onsite",
      };
      return modelMap[model] || null;
    };

    const query = `
      INSERT INTO employees (
        employee_id, full_name, age, gender, years_of_experience, job_role, salary,
        performance_rating, number_of_promotions, overtime, commuting_distance,
        education_level, marital_status, number_of_dependents, job_level,
        last_hike, years_in_current_role, working_model, working_hours,
        department, no_of_companies_worked_previously, leaves_taken,
        years_with_company, attrition_score, attrition, top_positive_contributors, top_negative_contributors
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27
      ) RETURNING *
    `;

    const values = [
      employee_id,
      full_name,
      age,
      mapGender(gender),
      years_of_experience,
      job_role,
      salary,
      performance_rating,
      number_of_promotions,
      overtime,
      commuting_distance,
      education_level,
      marital_status,
      number_of_dependents,
      job_level,
      last_hike,
      years_in_current_role,
      mapWorkingModel(working_model),
      working_hours,
      department,
      no_of_companies_worked_previously,
      leaves_taken,
      years_with_company,
      attrition_score || 0.5,
      attrition || 0,
      top_positive_contributors
        ? JSON.stringify(top_positive_contributors)
        : null,
      top_negative_contributors
        ? JSON.stringify(top_negative_contributors)
        : null,
    ];

    console.log("Executing query with values:", values);

    const result = await pool.query(query, values);
    console.log("Employee created successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating employee:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
    });
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      code: error.code,
    });
  }
};

export const createEmployeesBulkHandler = async (req, res) => {
  try {
    const employeesArray = req.body;

    if (!Array.isArray(employeesArray) || employeesArray.length === 0) {
      return res.status(400).json({ error: "Input must be a non-empty array" });
    }

    const values = [];
    const placeholders = employeesArray
      .map((emp, i) => {
        const base = i * 27;

        values.push(
          emp.employee_id,
          emp.full_name,
          emp.age,
          emp.gender,
          emp.years_of_experience,
          emp.job_role,
          emp.salary,
          emp.performance_rating,
          emp.number_of_promotions,
          emp.overtime,
          emp.commuting_distance,
          emp.education_level,
          emp.marital_status,
          emp.number_of_dependents,
          emp.job_level,
          emp.last_hike,
          emp.years_in_current_role,
          emp.working_model,
          emp.working_hours,
          emp.department,
          emp.no_of_companies_worked_previously,
          emp.leaves_taken,
          emp.years_with_company,
          emp.attrition_score || 0.5,
          emp.attrition,
          JSON.stringify(emp.top_positive_contributors || []),
          JSON.stringify(emp.top_negative_contributors || [])
        );

        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${
          base + 5
        }, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${
          base + 10
        }, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${
          base + 15
        }, $${base + 16}, $${base + 17}, $${base + 18}, $${base + 19}, $${
          base + 20
        }, $${base + 21}, $${base + 22}, $${base + 23}, $${base + 24}, $${
          base + 25
        }, $${base + 26}, $${base + 27})`;
      })
      .join(", ");

    const query = `
      INSERT INTO employees (
        employee_id, full_name, age, gender, years_of_experience, job_role, salary,
        performance_rating, number_of_promotions, overtime, commuting_distance,
        education_level, marital_status, number_of_dependents, job_level,
        last_hike, years_in_current_role, working_model, working_hours,
        department, no_of_companies_worked_previously, leaves_taken,
        years_with_company, attrition_score, attrition,
        top_positive_contributors, top_negative_contributors
      )
      VALUES ${placeholders}
      ON CONFLICT (employee_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        years_of_experience = EXCLUDED.years_of_experience,
        job_role = EXCLUDED.job_role,
        salary = EXCLUDED.salary,
        performance_rating = EXCLUDED.performance_rating,
        number_of_promotions = EXCLUDED.number_of_promotions,
        overtime = EXCLUDED.overtime,
        commuting_distance = EXCLUDED.commuting_distance,
        education_level = EXCLUDED.education_level,
        marital_status = EXCLUDED.marital_status,
        number_of_dependents = EXCLUDED.number_of_dependents,
        job_level = EXCLUDED.job_level,
        last_hike = EXCLUDED.last_hike,
        years_in_current_role = EXCLUDED.years_in_current_role,
        working_model = EXCLUDED.working_model,
        working_hours = EXCLUDED.working_hours,
        department = EXCLUDED.department,
        no_of_companies_worked_previously = EXCLUDED.no_of_companies_worked_previously,
        leaves_taken = EXCLUDED.leaves_taken,
        years_with_company = EXCLUDED.years_with_company,
        attrition_score = EXCLUDED.attrition_score,
        attrition = EXCLUDED.attrition,
        top_positive_contributors = EXCLUDED.top_positive_contributors,
        top_negative_contributors = EXCLUDED.top_negative_contributors
      RETURNING *;
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${result.rows.length} employee(s). Existing employees were updated.`,
      total: result.rows.length,
      employees: result.rows,
    });
  } catch (error) {
    console.error("Bulk employee creation/update failed:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    const allowedFields = [
      "full_name",
      "age",
      "gender",
      "years_of_experience",
      "job_role",
      "salary",
      "performance_rating",
      "number_of_promotions",
      "overtime",
      "commuting_distance",
      "education_level",
      "marital_status",
      "number_of_dependents",
      "job_level",
      "last_hike",
      "years_in_current_role",
      "working_model",
      "working_hours",
      "department",
      "no_of_companies_worked_previously",
      "leaves_taken",
      "years_with_company",
      "attrition",
      "attrition_score",
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Add updated_at
    // paramCount++;
    // updateFields.push(`updated_at = $${paramCount}`);
    // values.push(new Date());

    // Add employee ID for WHERE clause
    paramCount++;
    values.push(id);

    const query = `
      UPDATE employees 
      SET ${updateFields.join(", ")}
      WHERE employee_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM employees WHERE employee_id = $1 RETURNING *";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({
      message: "Employee deleted successfully",
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get department statistics
export const getDepartmentStats = async (req, res) => {
  try {
    const query = `
      SELECT * FROM employee_analytics
      ORDER BY attrition_rate DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attrition risk distribution
export const getAttritionRiskDistribution = async (req, res) => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN attrition_score > 0.7 THEN 'High Risk'
          WHEN attrition_score BETWEEN 0.4 AND 0.7 THEN 'Medium Risk'
          ELSE 'Low Risk'
        END as risk_level,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM employees WHERE attrition = 0), 1) as percentage
      FROM employees 
      WHERE attrition = 0
      GROUP BY 
        CASE 
          WHEN attrition_score > 0.7 THEN 'High Risk'
          WHEN attrition_score BETWEEN 0.4 AND 0.7 THEN 'Medium Risk'
          ELSE 'Low Risk'
        END
      ORDER BY 
        CASE 
          WHEN risk_level = 'High Risk' THEN 1
          WHEN risk_level = 'Medium Risk' THEN 2
          ELSE 3
        END
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attrition risk distribution:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
