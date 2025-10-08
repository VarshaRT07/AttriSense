import pool from "../config/database.js";

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Get employee stats
    const employeeStatsQuery = `
      SELECT
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE attrition = 0) as active_employees,
        COUNT(*) FILTER (WHERE attrition = 1) as attrited_employees,
        ROUND(
          (COUNT(*) FILTER (WHERE attrition = 1)::decimal / COUNT(*)) * 100, 2
        ) as attrition_rate,
        ROUND(AVG(salary), 2) as avg_salary,
        ROUND(AVG(age), 1) as avg_age,
        ROUND(AVG(years_with_company), 1) as avg_tenure,
        ROUND(AVG(performance_rating), 2) as avg_performance
      FROM employees
    `;

    // Get department analytics
    const departmentAnalyticsQuery = `
      SELECT
        department,
        COUNT(*) as total_employees,
        COUNT(*) as employee_count,
        COUNT(CASE WHEN attrition = 1 THEN 1 END) as attrited_employees,
        ROUND(COUNT(CASE WHEN attrition = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as attrition_rate,
        ROUND(AVG(salary), 2) as avg_salary,
        ROUND(AVG(attrition_score), 3) as avg_attrition_score,
        COUNT(CASE WHEN attrition_score > 0.7 THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN attrition_score BETWEEN 0.4 AND 0.7 THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN attrition_score < 0.4 THEN 1 END) as low_risk_count
      FROM employees
      GROUP BY department
      ORDER BY department
    `;

    // Get risk distribution
    const riskDistributionQuery = `
      SELECT
        risk_level,
        COUNT(*) as count
      FROM (
        SELECT
          CASE
            WHEN attrition_score >= 0.7 THEN 'High'
            WHEN attrition_score >= 0.4 THEN 'Medium'
            ELSE 'Low'
          END as risk_level
        FROM employees
      ) risk_data
      GROUP BY risk_level
      ORDER BY
        CASE
          WHEN risk_level = 'High' THEN 1
          WHEN risk_level = 'Medium' THEN 2
          ELSE 3
        END
    `;

    // Get pulse survey stats
    // Get pulse survey stats
    const pulseSurveyStatsQuery = `
      SELECT
        COUNT(*) as total_responses,
        ROUND(AVG(job_satisfaction), 2) as avg_job_satisfaction,
        ROUND(AVG(work_life_balance), 2) as avg_work_life_balance,
        ROUND(AVG(career_growth_opportunities), 2) as avg_career_growth,
        ROUND(AVG(recognition_reward_sat), 2) as avg_compensation_satisfaction,
        ROUND(AVG(relationship_with_manager), 2) as avg_management_satisfaction,
        ROUND(AVG(team_cohesion_support), 2) as avg_team_collaboration,
        ROUND(AVG(stress_levels), 2) as avg_workload_stress,
        ROUND(AVG(recognition_reward_sat), 2) as avg_recognition,
        ROUND(AVG(training_skill_dev_sat), 2) as avg_learning_opportunities,
        ROUND(AVG(overall_engagement), 2) as avg_engagement,
        ROUND(AVG(perceived_job_security), 2) as avg_likelihood_to_recommend
      FROM pulse_surveys
    `;

    // Get working model stats
    const workingModelStatsQuery = `
      SELECT
        working_model,
        COUNT(*) as count,
        ROUND(AVG(attrition_score), 3) as avg_attrition_score
      FROM employees
      WHERE working_model IS NOT NULL
      GROUP BY working_model
      ORDER BY count DESC
    `;

    // Execute all queries in parallel
    const [
      employeeStatsResult,
      departmentAnalyticsResult,
      riskDistributionResult,
      pulseSurveyStatsResult,
      workingModelStatsResult,
    ] = await Promise.all([
      pool.query(employeeStatsQuery),
      pool.query(departmentAnalyticsQuery),
      pool.query(riskDistributionQuery),
      pool.query(pulseSurveyStatsQuery),
      pool.query(workingModelStatsQuery),
    ]);

    // Generate simulated monthly trends (since we don't have historical data)
    // const monthlyTrends = [];
    // const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    // for (let i = 0; i < months.length; i++) {
    //   monthlyTrends.push({
    //     month: months[i],
    //     attrition_count: Math.floor(Math.random() * 10) + 5,
    //     new_hires: Math.floor(Math.random() * 15) + 10,
    //     total_employees: 150 + Math.floor(Math.random() * 50),
    //   });
    // }

    const dashboardData = {
      employeeStats: employeeStatsResult.rows[0],
      departmentAnalytics: departmentAnalyticsResult.rows,
      riskDistribution: riskDistributionResult.rows,
      pulseSurveyStats: pulseSurveyStatsResult.rows[0],
      workingModelStats: workingModelStatsResult.rows,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get attrition trends
export const getAttritionTrends = async (req, res) => {
  try {
    const { period = "6months" } = req.query;

    // Since we don't have historical data, generate simulated trends
    const trends = [];
    let monthCount;

    switch (period) {
      case "3months":
        monthCount = 3;
        break;
      case "1year":
        monthCount = 12;
        break;
      default:
        monthCount = 6;
    }

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    for (let i = 0; i < monthCount; i++) {
      trends.push({
        month: months[i],
        attrition_count: Math.floor(Math.random() * 15) + 5,
        attrition_rate: (Math.random() * 10 + 5).toFixed(02),
        new_hires: Math.floor(Math.random() * 20) + 10,
      });
    }

    res.json(trends);
  } catch (error) {
    console.error("Error fetching attrition trends:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get department comparison
export const getDepartmentComparison = async (req, res) => {
  try {
    const query = `
      SELECT
        department,
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE attrition = 1) as attrited_count,
        ROUND(
          (COUNT(*) FILTER (WHERE attrition = 1)::decimal / COUNT(*)) * 100, 2
        ) as attrition_rate,
        ROUND(AVG(salary), 2) as avg_salary,
        ROUND(AVG(attrition_score), 3) as avg_risk_score,
        ROUND(AVG(performance_rating), 2) as avg_performance,
        ROUND(AVG(years_with_company), 1) as avg_tenure
      FROM employees
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY attrition_rate DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching department comparison:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get employee segmentation
export const getEmployeeSegmentation = async (req, res) => {
  try {
    // Age groups
    const ageGroupsQuery = `
      WITH age_seg AS (
        SELECT
          CASE
            WHEN age < 25 THEN 'Under 25'
            WHEN age BETWEEN 25 AND 34 THEN '25-34'
            WHEN age BETWEEN 35 AND 44 THEN '35-44'
            WHEN age BETWEEN 45 AND 54 THEN '45-54'
            ELSE '55+'
          END as age_group,
          COUNT(*) as count,
          ROUND(AVG(attrition_score), 3) as avg_attrition_score,
          COUNT(*) FILTER (WHERE attrition = 1) as attrited_count
        FROM employees
        GROUP BY
          CASE
            WHEN age < 25 THEN 'Under 25'
            WHEN age BETWEEN 25 AND 34 THEN '25-34'
            WHEN age BETWEEN 35 AND 44 THEN '35-44'
            WHEN age BETWEEN 45 AND 54 THEN '45-54'
            ELSE '55+'
          END
      )
      SELECT *
      FROM age_seg
      ORDER BY
        CASE age_group
          WHEN 'Under 25' THEN 1
          WHEN '25-34' THEN 2
          WHEN '35-44' THEN 3
          WHEN '45-54' THEN 4
          ELSE 5
        END
    `;

    // Tenure groups
    const tenureGroupsQuery = `
      WITH tenure_seg AS (
        SELECT
          CASE
            WHEN years_with_company <= 2 THEN '0-2 years'
            WHEN years_with_company BETWEEN 3 AND 5 THEN '3-5 years'
            WHEN years_with_company BETWEEN 6 AND 10 THEN '6-10 years'
            WHEN years_with_company BETWEEN 11 AND 15 THEN '11-15 years'
            ELSE '15+ years'
          END as tenure_group,
          COUNT(*) as count,
          ROUND(AVG(attrition_score), 3) as avg_attrition_score,
          COUNT(*) FILTER (WHERE attrition = 1) as attrited_count
        FROM employees
        GROUP BY
          CASE
            WHEN years_with_company <= 2 THEN '0-2 years'
            WHEN years_with_company BETWEEN 3 AND 5 THEN '3-5 years'
            WHEN years_with_company BETWEEN 6 AND 10 THEN '6-10 years'
            WHEN years_with_company BETWEEN 11 AND 15 THEN '11-15 years'
            ELSE '15+ years'
          END
      )
      SELECT *
      FROM tenure_seg
      ORDER BY
        CASE tenure_group
          WHEN '0-2 years' THEN 1
          WHEN '3-5 years' THEN 2
          WHEN '6-10 years' THEN 3
          WHEN '11-15 years' THEN 4
          ELSE 5
        END
    `;

    // Performance groups
    const performanceGroupsQuery = `
      WITH performance_seg AS (
        SELECT
          CASE
            WHEN performance_rating <= 2 THEN 'Poor (1-2)'
            WHEN performance_rating = 3 THEN 'Average (3)'
            WHEN performance_rating = 4 THEN 'Good (4)'
            ELSE 'Excellent (5)'
          END as performance_group,
          COUNT(*) as count,
          ROUND(AVG(attrition_score), 3) as avg_attrition_score,
          COUNT(*) FILTER (WHERE attrition = 1) as attrited_count
        FROM employees
        WHERE performance_rating IS NOT NULL
        GROUP BY
          CASE
            WHEN performance_rating <= 2 THEN 'Poor (1-2)'
            WHEN performance_rating = 3 THEN 'Average (3)'
            WHEN performance_rating = 4 THEN 'Good (4)'
            ELSE 'Excellent (5)'
          END
      )
      SELECT *
      FROM performance_seg
      ORDER BY
        CASE performance_group
          WHEN 'Poor (1-2)' THEN 1
          WHEN 'Average (3)' THEN 2
          WHEN 'Good (4)' THEN 3
          ELSE 4
        END
    `;

    // Execute all queries in parallel
    const [ageGroupsResult, tenureGroupsResult, performanceGroupsResult] =
      await Promise.all([
        pool.query(ageGroupsQuery),
        pool.query(tenureGroupsQuery),
        pool.query(performanceGroupsQuery),
      ]);

    res.json({
      ageGroups: ageGroupsResult.rows,
      tenureGroups: tenureGroupsResult.rows,
      performanceGroups: performanceGroupsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching employee segmentation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get predictive insights
export const getPredictiveInsights = async (req, res) => {
  try {
    // High-risk employees
    const highRiskQuery = `
      SELECT
        e.employee_id,
        e.full_name,
        e.department,
        e.job_role,
        e.attrition_score,
        e.salary,
        e.years_with_company,
        e.performance_rating,
        CASE
          WHEN e.attrition_score >= 0.8 THEN 1
          WHEN e.attrition_score >= 0.7 THEN 2
          ELSE 3
        END as predicted_months_to_leave
      FROM employees e
      WHERE e.attrition_score >= 0.7
      ORDER BY e.attrition_score DESC
      LIMIT 20
    `;

    // Department risks
    const departmentRisksQuery = `
      SELECT
        department,
        COUNT(*) as total_employees,
        COUNT(*) FILTER (WHERE attrition_score >= 0.7) as high_risk_count,
        ROUND(AVG(attrition_score), 3) as risk_score,
        ROUND(AVG(salary), 2) as avg_salary,
        ROUND(AVG(performance_rating), 2) as avg_performance
      FROM employees
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY risk_score DESC
    `;

    // Retention factors (based on low attrition employees)
    const retentionFactorsQuery = `
      WITH low_attrition AS (
        SELECT * FROM employees WHERE attrition_score < 0.3
      ),
      high_attrition AS (
        SELECT * FROM employees WHERE attrition_score >= 0.7
      )
      SELECT
        'Competitive Salary' as factor,
        'Employees with above-average salary show lower attrition' as description,
        ROUND(
          (SELECT AVG(salary) FROM low_attrition) /
          (SELECT AVG(salary) FROM high_attrition),
          2
        ) as impact_score
      UNION ALL
      SELECT
        'Work-Life Balance' as factor,
        'Better work-life balance correlates with retention' as description,
        0.85 as impact_score
      UNION ALL
      SELECT
        'Career Growth' as factor,
        'Regular promotions reduce attrition risk' as description,
        ROUND(
          (SELECT AVG(number_of_promotions) FROM low_attrition) /
          NULLIF((SELECT AVG(number_of_promotions) FROM high_attrition), 0),
          2
        ) as impact_score
      UNION ALL
      SELECT
        'Performance Recognition' as factor,
        'High performers with recognition stay longer' as description,
        0.78 as impact_score
    `;

    const [highRiskResult, departmentRisksResult, retentionFactorsResult] =
      await Promise.all([
        pool.query(highRiskQuery),
        pool.query(departmentRisksQuery),
        pool.query(retentionFactorsQuery),
      ]);

    res.json({
      high_risk_employees: highRiskResult.rows,
      department_risks: departmentRisksResult.rows,
      retention_factors: retentionFactorsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching predictive insights:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get employee detailed analytics
export const getEmployeeAnalytics = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Employee details with risk analysis
    const employeeQuery = `
      SELECT
        e.*,
        CASE
          WHEN e.attrition_score >= 0.7 THEN 'High'
          WHEN e.attrition_score >= 0.4 THEN 'Medium'
          ELSE 'Low'
        END as risk_level,
        (
          SELECT AVG(attrition_score)
          FROM employees
          WHERE department = e.department
        ) as dept_avg_risk,
        (
          SELECT AVG(salary)
          FROM employees
          WHERE department = e.department AND job_role = e.job_role
        ) as role_avg_salary
      FROM employees e
      WHERE e.employee_id = $1
    `;

    // Employee survey history
    const surveyHistoryQuery = `
      SELECT *
      FROM pulse_surveys
      WHERE employee_id = $1
      ORDER BY survey_date DESC
    `;

    // Similar employees (for comparison)
    const similarEmployeesQuery = `
      SELECT
        employee_id,
        full_name,
        attrition_score,
        salary,
        performance_rating
      FROM employees
      WHERE department = (SELECT department FROM employees WHERE employee_id = $1)
        AND job_level = (SELECT job_level FROM employees WHERE employee_id = $1)
        AND employee_id != $1
      ORDER BY ABS(attrition_score - (SELECT attrition_score FROM employees WHERE employee_id = $1))
      LIMIT 5
    `;

    const [employeeResult, surveyHistoryResult, similarEmployeesResult] =
      await Promise.all([
        pool.query(employeeQuery, [employeeId]),
        pool.query(surveyHistoryQuery, [employeeId]),
        pool.query(similarEmployeesQuery, [employeeId]),
      ]);

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({
      employee: employeeResult.rows[0],
      survey_history: surveyHistoryResult.rows,
      similar_employees: similarEmployeesResult.rows,
    });
  } catch (error) {
    console.error("Error fetching employee analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get SHAP analysis data
export const getShapAnalysis = async (req, res) => {
  try {
    const { type = "summary", employeeId } = req.query;

    // If employee-specific, fetch employee data
    if (employeeId) {
      const employeeQuery = `SELECT * FROM employees WHERE employee_id = $1`;
      const result = await pool.query(employeeQuery, [employeeId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const employee = result.rows[0];

      // Return employee data with SHAP contributors
      res.json({
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        attrition_score: employee.attrition_score,
        top_positive_contributors: employee.top_positive_contributors || [],
        top_negative_contributors: employee.top_negative_contributors || [],
      });
    } else {
      // Return aggregated SHAP data
      const aggregatedQuery = `
        SELECT
          jsonb_array_elements(top_positive_contributors) as positive_features,
          jsonb_array_elements(top_negative_contributors) as negative_features
        FROM employees
        WHERE top_positive_contributors IS NOT NULL
          AND top_negative_contributors IS NOT NULL
        LIMIT 100
      `;

      const result = await pool.query(aggregatedQuery);
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error fetching SHAP analysis:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get time-based trends (if we add timestamps later)
export const getTimeTrends = async (req, res) => {
  try {
    const { period = "30days" } = req.query;

    // For now, return current snapshot with simulated historical data
    // In production, you'd query actual historical data
    const currentStatsQuery = `
      SELECT
        COUNT(*) as total_employees,
        ROUND(AVG(attrition_score), 3) as avg_risk_score,
        COUNT(*) FILTER (WHERE attrition_score >= 0.7) as high_risk_count,
        COUNT(*) FILTER (WHERE attrition = 1) as attrited_count
      FROM employees
    `;

    const result = await pool.query(currentStatsQuery);
    const currentStats = result.rows[0];

    // Simulate trend data (replace with actual historical queries when available)
    const trendData = [];
    const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trendData.push({
        date: date.toISOString().split("T")[0],
        total_employees:
          currentStats.total_employees + Math.floor(Math.random() * 10 - 5),
        avg_risk_score: (
          parseFloat(currentStats.avg_risk_score) +
          (Math.random() * 0.1 - 0.05)
        ).toFixed(3),
        high_risk_count:
          parseInt(currentStats.high_risk_count) +
          Math.floor(Math.random() * 5 - 2),
        attrited_count: parseInt(currentStats.attrited_count),
      });
    }

    res.json({
      period,
      current: currentStats,
      trend: trendData,
    });
  } catch (error) {
    console.error("Error fetching time trends:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get department deep dive
export const getDepartmentDeepDive = async (req, res) => {
  try {
    const { department } = req.params;

    const query = `
      SELECT
        e.employee_id,
        e.full_name,
        e.job_role,
        e.job_level,
        e.attrition_score,
        e.salary,
        e.performance_rating,
        e.years_with_company,
        CASE
          WHEN e.attrition_score >= 0.7 THEN 'High'
          WHEN e.attrition_score >= 0.4 THEN 'Medium'
          ELSE 'Low'
        END as risk_level
      FROM employees e
      WHERE e.department = $1
      ORDER BY e.attrition_score DESC
    `;

    const statsQuery = `
      SELECT
        COUNT(*) as total_employees,
        ROUND(AVG(attrition_score), 3) as avg_risk_score,
        ROUND(AVG(salary), 2) as avg_salary,
        ROUND(AVG(performance_rating), 2) as avg_performance,
        COUNT(*) FILTER (WHERE attrition_score >= 0.7) as high_risk_count,
        COUNT(*) FILTER (WHERE attrition = 1) as attrited_count
      FROM employees
      WHERE department = $1
    `;

    const [employeesResult, statsResult] = await Promise.all([
      pool.query(query, [department]),
      pool.query(statsQuery, [department]),
    ]);

    res.json({
      department,
      stats: statsResult.rows[0],
      employees: employeesResult.rows,
    });
  } catch (error) {
    console.error("Error fetching department deep dive:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get retention recommendations
export const getRetentionRecommendations = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employeeQuery = `
      SELECT * FROM employees WHERE employee_id = $1
    `;

    const result = await pool.query(employeeQuery, [employeeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = result.rows[0];
    const recommendations = [];

    // Generate recommendations based on employee data
    if (employee.salary < 50000) {
      recommendations.push({
        priority: "High",
        category: "Compensation",
        recommendation: "Consider salary adjustment",
        details: `Current salary (${employee.salary}) is below market average for ${employee.job_role}`,
        estimated_impact: "25% risk reduction",
      });
    }

    if (
      employee.number_of_promotions === 0 &&
      employee.years_with_company > 2
    ) {
      recommendations.push({
        priority: "High",
        category: "Career Growth",
        recommendation: "Discuss promotion opportunities",
        details: `No promotions in ${employee.years_with_company} years with company`,
        estimated_impact: "20% risk reduction",
      });
    }

    if (employee.overtime) {
      recommendations.push({
        priority: "Medium",
        category: "Work-Life Balance",
        recommendation: "Review workload and overtime",
        details: "Employee is working overtime regularly",
        estimated_impact: "15% risk reduction",
      });
    }

    if (employee.performance_rating >= 4 && employee.attrition_score >= 0.7) {
      recommendations.push({
        priority: "Critical",
        category: "Retention",
        recommendation: "Immediate retention conversation needed",
        details: "High performer with high attrition risk - critical to retain",
        estimated_impact: "30% risk reduction",
      });
    }

    if (employee.years_in_current_role > 3) {
      recommendations.push({
        priority: "Medium",
        category: "Career Development",
        recommendation: "Explore lateral moves or new challenges",
        details: `${employee.years_in_current_role} years in current role may indicate stagnation`,
        estimated_impact: "18% risk reduction",
      });
    }

    res.json({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      current_risk_score: employee.attrition_score,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    });
  } catch (error) {
    console.error("Error generating retention recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get data-driven intervention recommendations
export const getInterventionRecommendations = async (req, res) => {
  try {
    // Get pulse survey averages and correlate with attrition
    const surveyAnalysisQuery = `
      WITH survey_attrition_correlation AS (
        SELECT
          ps.employee_id,
          ps.job_satisfaction,
          ps.work_life_balance,
          ps.career_growth_opportunities,
          ps.recognition_reward_sat,
          ps.relationship_with_manager,
          ps.training_skill_dev_sat,
          ps.stress_levels,
          e.attrition_score,
          CASE WHEN e.attrition_score >= 0.7 THEN 1 ELSE 0 END as is_high_risk
        FROM pulse_surveys ps
        JOIN employees e ON ps.employee_id = e.employee_id
      )
      SELECT
        ROUND(AVG(job_satisfaction), 2) as avg_job_satisfaction,
        ROUND(AVG(work_life_balance), 2) as avg_work_life_balance,
        ROUND(AVG(career_growth_opportunities), 2) as avg_career_growth,
        ROUND(AVG(recognition_reward_sat), 2) as avg_compensation_satisfaction,
        ROUND(AVG(relationship_with_manager), 2) as avg_management_satisfaction,
        ROUND(AVG(training_skill_dev_sat), 2) as avg_learning_opportunities,
        ROUND(AVG(stress_levels), 2) as avg_stress_levels,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN job_satisfaction END), 2) as high_risk_job_satisfaction,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN work_life_balance END), 2) as high_risk_work_life_balance,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN career_growth_opportunities END), 2) as high_risk_career_growth,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN recognition_reward_sat END), 2) as high_risk_compensation,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN relationship_with_manager END), 2) as high_risk_management,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN training_skill_dev_sat END), 2) as high_risk_learning,
        ROUND(AVG(CASE WHEN is_high_risk = 1 THEN stress_levels END), 2) as high_risk_stress,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN job_satisfaction END), 2) as low_risk_job_satisfaction,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN work_life_balance END), 2) as low_risk_work_life_balance,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN career_growth_opportunities END), 2) as low_risk_career_growth,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN recognition_reward_sat END), 2) as low_risk_compensation,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN relationship_with_manager END), 2) as low_risk_management,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN training_skill_dev_sat END), 2) as low_risk_learning,
        ROUND(AVG(CASE WHEN is_high_risk = 0 THEN stress_levels END), 2) as low_risk_stress,
        COUNT(*) as total_surveys,
        COUNT(*) FILTER (WHERE is_high_risk = 1) as high_risk_count
      FROM survey_attrition_correlation
    `;

    const surveyResult = await pool.query(surveyAnalysisQuery);
    res.json({ survey_analysis: surveyResult.rows[0] });
  } catch (error) {
    console.error("Error fetching intervention recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
