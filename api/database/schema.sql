-- ============================================================
-- Attrition System Database Schema
-- ============================================================

-- ================================
-- Employees Table
-- ================================
CREATE TABLE IF NOT EXISTS public.employees
(
    employee_id INT PRIMARY KEY,
    full_name TEXT NOT NULL,
    age INT,
    gender VARCHAR(10) CHECK (gender IN ('M', 'F', 'O')),
    years_of_experience INT,
    job_role TEXT,
    salary NUMERIC(10,2),
    performance_rating INT CHECK (performance_rating BETWEEN 1 AND 5),
    number_of_promotions INT,
    overtime BOOLEAN,
    commuting_distance INT,
    education_level VARCHAR(20) CHECK (education_level in ('Graduate', 'Post-Graduate', 'Diploma', 'School', 'Doctorate')),
    marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    number_of_dependents INT,
    job_level INT CHECK (job_level BETWEEN 1 AND 10),
    last_hike NUMERIC(5,2),
    years_in_current_role INT,
    working_model VARCHAR(20) CHECK (working_model IN ('Remote', 'Hybrid', 'Onsite')),
    working_hours INT,
    department VARCHAR(50),
    no_of_companies_worked_previously INT,
    leaves_taken INT,
    years_with_company INT,
    attrition_score NUMERIC(4,3), -- 0.000 to 1.000
    attrition INT CHECK (attrition IN (0,1)),
    top_positive_contributors JSONB,
    top_negative_contributors JSONB

);

-- ================================
-- Pulse Surveys Table
-- ================================
CREATE TABLE IF NOT EXISTS public.pulse_surveys
(
    survey_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    work_life_balance INT CHECK (work_life_balance BETWEEN 1 AND 5),
    job_satisfaction INT CHECK (job_satisfaction BETWEEN 1 AND 5),
    relationship_with_manager INT CHECK (relationship_with_manager BETWEEN 1 AND 5),
    communication_effectiveness INT CHECK (communication_effectiveness BETWEEN 1 AND 5),
    recognition_reward_sat INT CHECK (recognition_reward_sat BETWEEN 1 AND 5),
    career_growth_opportunities INT CHECK (career_growth_opportunities BETWEEN 1 AND 5),
    alignment_with_company_values INT CHECK (alignment_with_company_values BETWEEN 1 AND 5),
    perceived_fairness INT CHECK (perceived_fairness BETWEEN 1 AND 5),
    team_cohesion_support INT CHECK (team_cohesion_support BETWEEN 1 AND 5),
    autonomy_at_work INT CHECK (autonomy_at_work BETWEEN 1 AND 5),
    overall_engagement INT CHECK (overall_engagement BETWEEN 1 AND 5),
    training_skill_dev_sat INT CHECK (training_skill_dev_sat BETWEEN 1 AND 5),
    stress_levels INT CHECK (stress_levels BETWEEN 1 AND 5),
    org_change_readiness INT CHECK (org_change_readiness BETWEEN 1 AND 5),
    feedback_usefulness INT CHECK (feedback_usefulness BETWEEN 1 AND 5),
    flexibility_support INT CHECK (flexibility_support BETWEEN 1 AND 5),
    conflict_at_work INT CHECK (conflict_at_work BETWEEN 1 AND 5),
    perceived_job_security INT CHECK (perceived_job_security BETWEEN 1 AND 5),
    environment_satisfaction INT CHECK (environment_satisfaction BETWEEN 1 AND 5),
    survey_date DATE DEFAULT CURRENT_DATE,
    attrition_score NUMERIC(4,3),
    attrition INT CHECK (attrition IN (0,1)),
    top_positive_contributors JSONB,
    top_negative_contributors JSONB,
    CONSTRAINT unique_employee_survey UNIQUE (employee_id)
);

-- ================================
-- Attrition Scores Table
-- ================================
CREATE TABLE IF NOT EXISTS public.attrition_scores
(
    score_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id) ON DELETE CASCADE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    base_score NUMERIC(4,3),
    pulse_score NUMERIC(4,3),
    combined_score NUMERIC(4,3),
    risk_level VARCHAR(10) CHECK (risk_level IN ('Low','Medium','High'))
);

-- ============================================================
-- Indexes for faster queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_attrition_score ON employees(attrition_score);
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_employee ON pulse_surveys(employee_id);
CREATE INDEX IF NOT EXISTS idx_attrition_scores_employee ON attrition_scores(employee_id);

