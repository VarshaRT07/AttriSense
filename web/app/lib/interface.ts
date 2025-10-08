// Employee interfaces
export interface Contributor {
  feature: string;
  contribution: number;
}

export interface Employee {
  employee_id: number;
  full_name: string;
  age?: number;
  gender?: "Male" | "Female";
  years_of_experience?: number;
  job_role?: string;
  salary?: number;
  performance_rating?: number; // 1-5
  number_of_promotions?: number;
  overtime?: boolean;
  commuting_distance?: number; // in km
  education_level?:
    | "Graduate"
    | "Post-Graduate"
    | "Diploma"
    | "School"
    | "Doctorate";
  marital_status?: "Single" | "Married" | "Divorced";
  number_of_dependents?: number;
  job_level?: number; // 1-5
  last_hike?: number; // percentage
  years_in_current_role?: number;
  working_model?: "Remote" | "Hybrid" | "Onsite";
  working_hours?: number; // per day
  department?: string;
  no_of_companies_worked_previously?: number;
  leaves_taken?: number;
  years_with_company?: number;
  attrition?: boolean; // false = No, true = Yes
  attrition_score?: number; // 0.000 to 1.000
  created_at?: string;
  updated_at?: string;
  top_positive_contributors?: Contributor[];
  top_negative_contributors?: Contributor[];
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  attrited_employees: number;
  attrition_rate: number;
  avg_salary: number;
  avg_age: number;
  avg_tenure: number;
  avg_performance: number;
  high_risk_count?: number;
  medium_risk_count?: number;
  low_risk_count?: number;
}

export interface AttritionStats {
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_attrition_score: number;
}

export interface DepartmentAnalytics {
  department: string;
  total_employees: number;
  attrited_employees: number;
  attrition_rate: number;
  avg_salary: number;
  avg_attrition_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_performance?: number;
  avg_tenure?: number;
}

export interface RiskDistribution {
  risk_level: "High" | "Medium" | "Low";
  count: number;
  percentage?: number;
}

export interface MonthlyTrend {
  month: string;
  attrition_count: number;
  new_hires: number;
  total_employees: number;
  attrition_rate?: number;
  retention_rate?: number;
  active_employees?: number;
}

export interface WorkingModelStats {
  working_model: "Remote" | "Hybrid" | "Onsite";
  count: number;
  percentage?: number;
  avg_attrition_score: number;
}

// Pulse Survey interfaces
export interface PulseSurvey {
  survey_id: number;
  employee_id: number;
  survey_date: string;
  work_life_balance?: number; // 1-5
  job_satisfaction?: number; // 1-5
  relationship_with_manager?: number; // 1-5
  communication_effectiveness?: number; // 1-5
  recognition_reward_sat?: number; // 1-5
  career_growth_opportunities?: number; // 1-5
  alignment_with_company_values?: number; // 1-5
  perceived_fairness?: number; // 1-5
  team_cohesion_support?: number; // 1-5
  autonomy_at_work?: number; // 1-5
  overall_engagement?: number; // 1-5
  training_skill_dev_sat?: number; // 1-5
  stress_levels?: number; // 1-5
  org_change_readiness?: number; // 1-5
  feedback_usefulness?: number; // 1-5
  flexibility_support?: number; // 1-5
  conflict_at_work?: number; // 1-5
  perceived_job_security?: number; // 1-5
  environment_satisfaction?: number; // 1-5
  full_name?: string;
  department?: string;
  job_role?: string;
  attrition?: boolean; // false = No, true = Yes
  attrition_score?: number; // 0.000 to 1.000
  top_positive_contributors?: Contributor[];
  top_negative_contributors?: Contributor[];
}

export interface PulseSurveyStats {
  total_responses: number;
  avg_job_satisfaction: number;
  avg_work_life_balance: number;
  avg_career_growth: number;
  avg_compensation_satisfaction: number;
  avg_management_satisfaction: number;
  avg_team_collaboration: number;
  avg_workload_stress: number;
  avg_recognition: number;
  avg_learning_opportunities: number;
  avg_engagement: number;
  avg_likelihood_to_recommend: number;
}

export interface DashboardData {
  employeeStats: EmployeeStats;
  departmentAnalytics: DepartmentAnalytics[];
  riskDistribution: RiskDistribution[];
  monthlyTrends: MonthlyTrend[];
  pulseSurveyStats: PulseSurveyStats;
  workingModelStats: WorkingModelStats[];
}

// Segmentation interfaces
export interface AgeGroup {
  age_group: string;
  count: number;
  avg_attrition_score: number;
  attrited_count: number;
}

export interface TenureGroup {
  tenure_group: string;
  count: number;
  avg_attrition_score: number;
  attrited_count: number;
}

export interface PerformanceGroup {
  performance_group: string;
  count: number;
  avg_attrition_score: number;
  attrited_count: number;
}

export interface EmployeeSegmentation {
  ageGroups: AgeGroup[];
  tenureGroups: TenureGroup[];
  performanceGroups: PerformanceGroup[];
  workingModelGroups: WorkingModelStats[];
}

// Predictive insights interfaces
export interface HighRiskEmployee {
  employee_id: number;
  full_name: string;
  department: string;
  job_role: string;
  attrition_score: number;
  performance_rating: number;
  years_with_company: number;
  salary: number;
  predicted_months_to_leave: number;
}

export interface DepartmentRisk {
  department: string;
  total_employees: number;
  high_risk_count: number;
  risk_score: number;
  predicted_exits_next_quarter: number;
}

export interface RetentionFactor {
  factor: string;
  impact_score: number;
  description: string;
}

export interface PredictiveInsights {
  high_risk_employees: HighRiskEmployee[];
  department_risks: DepartmentRisk[];
  retention_factors: RetentionFactor[];
}

// Analytics interfaces
export interface AttritionTrend {
  month: string;
  attrition_count: number;
  attrition_rate: string;
  new_hires: number;
}

export interface DepartmentComparison {
  department: string;
  total_employees: number;
  attrited_count: number;
  attrition_rate: number;
  avg_salary: number;
  avg_risk_score: number;
  avg_performance: number;
  avg_tenure: number;
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data?: T[]; // Optional for backward compatibility
  employees?: Employee[]; // For employee API responses
  surveys?: PulseSurvey[]; // For survey API responses
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems?: number; // Optional for backward compatibility
    totalEmployees?: number; // For employee API responses
    totalSurveys?: number; // For survey API responses
    limit: number;
  };
}

// Form interfaces
export interface CreateEmployeeRequest {
  full_name: string;
  age?: number;
  gender?: "Male" | "Female";
  years_of_experience?: number;
  job_role?: string;
  salary?: number;
  performance_rating?: number;
  number_of_promotions?: number;
  overtime?: boolean;
  commuting_distance?: number;
  education_level?:
    | "Graduate"
    | "Post-Graduate"
    | "Diploma"
    | "School"
    | "Doctorate";
  marital_status?: "Single" | "Married" | "Divorced";
  number_of_dependents?: number;
  job_level?: number;
  last_hike?: number;
  years_in_current_role?: number;
  working_model?: "Remote" | "Hybrid" | "Onsite";
  working_hours?: number;
  department?: string;
  no_of_companies_worked_previously?: number;
  leaves_taken?: number;
  years_with_company?: number;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  employee_id?: number;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  working_model?: "Remote" | "Hybrid" | "Onsite";
  attrition_risk?: "High" | "Medium" | "Low";
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Chart data interfaces
export interface ChartDataPoint {
  name?: string;
  value: number;
  label?: string;
  color?: string;
  x?: string | number;
  y?: number;
}

export interface LineChartData {
  id: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface BarChartData {
  [key: string]: string | number;
}

export interface PieChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
}

// Type aliases
export type AttritionRiskLevel = "High" | "Medium" | "Low";
export type WorkingModel = "Remote" | "Hybrid" | "Onsite";
export type Gender = "Male" | "Female";
export type MaritalStatus = "Single" | "Married" | "Divorced";
