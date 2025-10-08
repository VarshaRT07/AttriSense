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

    // Get salary analysis
    const salaryAnalysisQuery = `
      WITH salary_quartiles AS (
        SELECT
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) as q1,
          PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY salary) as median,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) as q3,
          AVG(salary) as avg_salary
        FROM employees
      ),
      salary_risk AS (
        SELECT
          CASE
            WHEN e.salary < sq.q1 THEN 'Below Market'
            WHEN e.salary < sq.median THEN 'Below Average'
            WHEN e.salary < sq.q3 THEN 'Average'
            ELSE 'Above Average'
          END as salary_bracket,
          COUNT(*) as employee_count,
          COUNT(*) FILTER (WHERE e.attrition_score >= 0.7) as high_risk_count,
          ROUND(AVG(e.attrition_score), 3) as avg_risk_score
        FROM employees e
        CROSS JOIN salary_quartiles sq
        GROUP BY salary_bracket
      )
      SELECT * FROM salary_risk
      ORDER BY avg_risk_score DESC
    `;

    const [surveyResult, salaryResult] = await Promise.all([
      pool.query(surveyAnalysisQuery),
      pool.query(salaryAnalysisQuery),
    ]);

    const surveyData = surveyResult.rows[0] || {};
    const salaryData = salaryResult.rows || [];

    // Generate recommendations based on actual data
    const recommendations = [];

    // 1. Job Satisfaction Analysis
    if (surveyData.avg_job_satisfaction) {
      const satisfactionGap =
        surveyData.low_risk_job_satisfaction -
        surveyData.high_risk_job_satisfaction;
      const riskIncrease =
        satisfactionGap > 0
          ? Math.round(
              (satisfactionGap / surveyData.low_risk_job_satisfaction) * 100
            )
          : 0;

      recommendations.push({
        priority:
          surveyData.avg_job_satisfaction < 3
            ? 1
            : surveyData.avg_job_satisfaction < 3.5
            ? 2
            : 3,
        category: "Job Satisfaction",
        title: "Enhance Job Satisfaction",
        riskFactor: `Low satisfaction correlates with ${riskIncrease}% higher attrition risk`,
        currentScore: surveyData.avg_job_satisfaction,
        highRiskScore: surveyData.high_risk_job_satisfaction,
        lowRiskScore: surveyData.low_risk_job_satisfaction,
        actions: [
          "Conduct quarterly satisfaction surveys and act on feedback",
          "Implement recognition and rewards programs",
          "Create clear career progression pathways",
        ],
      });
    }

    // 2. Work-Life Balance Analysis
    if (surveyData.avg_work_life_balance) {
      const balanceGap =
        surveyData.low_risk_work_life_balance -
        surveyData.high_risk_work_life_balance;
      const riskIncrease =
        balanceGap > 0
          ? Math.round(
              (balanceGap / surveyData.low_risk_work_life_balance) * 100
            )
          : 0;

      recommendations.push({
        priority:
          surveyData.avg_work_life_balance < 3
            ? 1
            : surveyData.avg_work_life_balance < 3.5
            ? 2
            : 4,
        category: "Work-Life Balance",
        title: "Improve Work-Life Balance",
        riskFactor: `Poor balance increases attrition by ${riskIncrease}%`,
        currentScore: surveyData.avg_work_life_balance,
        highRiskScore: surveyData.high_risk_work_life_balance,
        lowRiskScore: surveyData.low_risk_work_life_balance,
        actions: [
          "Offer flexible working hours and remote work options",
          "Monitor and reduce overtime hours",
          "Promote wellness programs and mental health support",
        ],
      });
    }

    // 3. Compensation Analysis
    const belowMarketSalary = salaryData.find(
      (s) => s.salary_bracket === "Below Market"
    );
    if (belowMarketSalary) {
      const compensationRisk = Math.round(
        (belowMarketSalary.high_risk_count / belowMarketSalary.employee_count) *
          100
      );

      recommendations.push({
        priority: belowMarketSalary.avg_risk_score > 0.6 ? 1 : 2,
        category: "Compensation",
        title: "Competitive Compensation",
        riskFactor: `${compensationRisk}% of below-market employees are high-risk`,
        affectedEmployees: belowMarketSalary.employee_count,
        highRiskCount: belowMarketSalary.high_risk_count,
        actions: [
          "Conduct annual market salary benchmarking",
          "Implement performance-based bonuses",
          "Review and enhance benefits packages",
        ],
      });
    }

    // 4. Career Growth Analysis
    if (surveyData.avg_career_growth) {
      const growthGap =
        surveyData.low_risk_career_growth - surveyData.high_risk_career_growth;
      const riskIncrease =
        growthGap > 0
          ? Math.round((growthGap / surveyData.low_risk_career_growth) * 100)
          : 0;

      recommendations.push({
        priority:
          surveyData.avg_career_growth < 3
            ? 1
            : surveyData.avg_career_growth < 3.5
            ? 2
            : 5,
        category: "Career Development",
        title: "Career Growth Opportunities",
        riskFactor: `Limited growth prospects increase risk by ${riskIncrease}%`,
        currentScore: surveyData.avg_career_growth,
        highRiskScore: surveyData.high_risk_career_growth,
        lowRiskScore: surveyData.low_risk_career_growth,
        actions: [
          "Create individual development plans (IDPs)",
          "Provide training and upskilling opportunities",
          "Establish mentorship programs",
        ],
      });
    }

    // 5. Management Quality Analysis
    if (surveyData.avg_management_satisfaction) {
      const managementGap =
        surveyData.low_risk_management - surveyData.high_risk_management;
      const riskIncrease =
        managementGap > 0
          ? Math.round((managementGap / surveyData.low_risk_management) * 100)
          : 0;

      recommendations.push({
        priority:
          surveyData.avg_management_satisfaction < 3
            ? 1
            : surveyData.avg_management_satisfaction < 3.5
            ? 2
            : 6,
        category: "Management",
        title: "Strengthen Management",
        riskFactor: `Poor manager relationships account for ${riskIncrease}% higher risk`,
        currentScore: surveyData.avg_management_satisfaction,
        highRiskScore: surveyData.high_risk_management,
        lowRiskScore: surveyData.low_risk_management,
        actions: [
          "Train managers on leadership and communication",
          "Implement 360-degree feedback systems",
          "Conduct regular one-on-one check-ins",
        ],
      });
    }

    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);

    res.json({
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      surveyMetrics: {
        totalSurveys: surveyData.total_surveys,
        highRiskCount: surveyData.high_risk_count,
        avgJobSatisfaction: surveyData.avg_job_satisfaction,
        avgWorkLifeBalance: surveyData.avg_work_life_balance,
        avgCareerGrowth: surveyData.avg_career_growth,
        avgManagementSatisfaction: surveyData.avg_management_satisfaction,
      },
    });
  } catch (error) {
    console.error("Error generating intervention recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
