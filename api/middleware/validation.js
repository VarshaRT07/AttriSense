// Validation middleware for employee data
export const validateEmployee = (req, res, next) => {
  const {
    full_name, age, gender, years_of_experience, job_role, salary,
    work_life_balance, job_satisfaction, performance_rating, department
  } = req.body;

  const errors = [];

  // Required fields validation
  if (!full_name || full_name.trim() === '') {
    errors.push('Full name is required');
  }
  if (!job_role || job_role.trim() === '') {
    errors.push('Job role is required');
  }
  if (!department || department.trim() === '') {
    errors.push('Department is required');
  }

  // Numeric validations
  if (age !== undefined && (age < 18 || age > 100)) {
    errors.push('Age must be between 18 and 100');
  }
  if (years_of_experience !== undefined && years_of_experience < 0) {
    errors.push('Years of experience cannot be negative');
  }
  if (salary !== undefined && salary < 0) {
    errors.push('Salary cannot be negative');
  }
  if (work_life_balance !== undefined && (work_life_balance < 1 || work_life_balance > 5)) {
    errors.push('Work life balance must be between 1 and 5');
  }
  if (job_satisfaction !== undefined && (job_satisfaction < 1 || job_satisfaction > 5)) {
    errors.push('Job satisfaction must be between 1 and 5');
  }
  if (performance_rating !== undefined && (performance_rating < 1 || performance_rating > 5)) {
    errors.push('Performance rating must be between 1 and 5');
  }

  // Gender validation
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Validation middleware for pulse survey data
export const validatePulseSurvey = (req, res, next) => {
  const {
    employee_id, work_life_balance, job_satisfaction, relationship_with_manager,
    communication_effectiveness, recognition_reward_sat, career_growth_opportunities,
    alignment_with_company_values, perceived_fairness, team_cohesion_support,
    autonomy_at_work, overall_engagement, training_skill_dev_sat, stress_levels,
    org_change_readiness, feedback_usefulness, flexibility_support, conflict_at_work,
    perceived_job_security, environment_satisfaction
  } = req.body;

  const errors = [];

  // Required fields
  if (!employee_id) {
    errors.push('Employee ID is required');
  }

  // Validate all rating fields are between 1 and 5
  const ratingFields = {
    work_life_balance, job_satisfaction, relationship_with_manager,
    communication_effectiveness, recognition_reward_sat, career_growth_opportunities,
    alignment_with_company_values, perceived_fairness, team_cohesion_support,
    autonomy_at_work, overall_engagement, training_skill_dev_sat, stress_levels,
    org_change_readiness, feedback_usefulness, flexibility_support, conflict_at_work,
    perceived_job_security, environment_satisfaction
  };

  Object.entries(ratingFields).forEach(([field, value]) => {
    if (value !== undefined && (value < 1 || value > 5)) {
      errors.push(`${field.replace(/_/g, ' ')} must be between 1 and 5`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const validatePulseSurveysBulk = (req, res, next) => {
  const surveysArray = req.body;

  if (!Array.isArray(surveysArray) || surveysArray.length === 0) {
    return res.status(400).json({ error: "Input must be a non-empty array" });
  }

  const errors = [];

  surveysArray.forEach((survey, index) => {
    const {
      employee_id, work_life_balance, job_satisfaction, relationship_with_manager,
      communication_effectiveness, recognition_reward_sat, career_growth_opportunities,
      alignment_with_company_values, perceived_fairness, team_cohesion_support,
      autonomy_at_work, overall_engagement, training_skill_dev_sat, stress_levels,
      org_change_readiness, feedback_usefulness, flexibility_support, conflict_at_work,
      perceived_job_security, environment_satisfaction
    } = survey;

    // Required field check
    if (!employee_id) {
      errors.push(`Item ${index + 1}: Employee ID is required`);
    }

    // Validate rating fields 1-5
    const ratingFields = {
      work_life_balance, job_satisfaction, relationship_with_manager,
      communication_effectiveness, recognition_reward_sat, career_growth_opportunities,
      alignment_with_company_values, perceived_fairness, team_cohesion_support,
      autonomy_at_work, overall_engagement, training_skill_dev_sat, stress_levels,
      org_change_readiness, feedback_usefulness, flexibility_support, conflict_at_work,
      perceived_job_security, environment_satisfaction
    };

    Object.entries(ratingFields).forEach(([field, value]) => {
      if (value !== undefined && (value < 1 || value > 5)) {
        errors.push(`Item ${index + 1}: ${field.replace(/_/g, ' ')} must be between 1 and 5`);
      }
    });
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors
    });
  }

  next();
};


// Validation middleware for attrition score data
export const validateAttritionScore = (req, res, next) => {
  const {
    employee_id, model_version, base_score, pulse_score, combined_score, risk_level
  } = req.body;

  const errors = [];

  // Required fields
  if (!employee_id) {
    errors.push('Employee ID is required');
  }
  if (!model_version || model_version.trim() === '') {
    errors.push('Model version is required');
  }

  // Score validations (should be between 0 and 1)
  if (base_score !== undefined && (base_score < 0 || base_score > 1)) {
    errors.push('Base score must be between 0 and 1');
  }
  if (pulse_score !== undefined && (pulse_score < 0 || pulse_score > 1)) {
    errors.push('Pulse score must be between 0 and 1');
  }
  if (combined_score !== undefined && (combined_score < 0 || combined_score > 1)) {
    errors.push('Combined score must be between 0 and 1');
  }

  // Risk level validation
  if (risk_level && !['Low', 'Medium', 'High'].includes(risk_level)) {
    errors.push('Risk level must be Low, Medium, or High');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const validateAttritionScoreBulk = (req, res, next) => {
  const arr = req.body;

  if (!Array.isArray(arr) || arr.length === 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: ["Request body must be a non-empty array"],
    });
  }

  const errors = [];

  arr.forEach((item, index) => {
    const {
      employee_id,
      model_version,
      base_score,
      pulse_score,
      combined_score,
      risk_level,
    } = item;

    // Required fields
    if (!employee_id) {
      errors.push(`Item ${index + 1}: Employee ID is required`);
    }
    if (!model_version || model_version.trim() === "") {
      errors.push(`Item ${index + 1}: Model version is required`);
    }

    // Score validations (should be between 0 and 1)
    if (
      base_score !== undefined &&
      (base_score < 0 || base_score > 1)
    ) {
      errors.push(`Item ${index + 1}: Base score must be between 0 and 1`);
    }
    if (
      pulse_score !== undefined &&
      (pulse_score < 0 || pulse_score > 1)
    ) {
      errors.push(`Item ${index + 1}: Pulse score must be between 0 and 1`);
    }
    if (
      combined_score !== undefined &&
      (combined_score < 0 || combined_score > 1)
    ) {
      errors.push(`Item ${index + 1}: Combined score must be between 0 and 1`);
    }

    // Risk level validation
    if (
      risk_level &&
      !["Low", "Medium", "High"].includes(risk_level)
    ) {
      errors.push(`Item ${index + 1}: Risk level must be Low, Medium, or High`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  next();
};
