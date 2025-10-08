import type {
  BarChartData,
  DashboardData,
  DepartmentAnalytics,
  Employee,
  LineChartData,
  MonthlyTrend,
  PieChartData,
  PulseSurvey,
  RiskDistribution,
  WorkingModel,
} from "~/lib/interface";

// Constants for better maintainability
const RISK_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
} as const;

const WORKING_MODEL_COLORS = {
  Remote: "#3b82f6",
  Hybrid: "#8b5cf6",
  "On-site": "#06b6d4",
} as const;

// Chart data transformation utilities
export const chartTransformers = {
  /**
   * Transform department analytics for bar chart
   */
  departmentData: (data: DepartmentAnalytics[]): BarChartData[] => {
    return data.map((dept) => ({
      department: dept.department,
      attritionRate: dept.attrition_rate,
      totalEmployees: dept.total_employees,
      attritionCount: dept.attrited_employees,
      avgSalary: dept.avg_salary,
      avgAttritionScore: dept.avg_attrition_score,
    }));
  },

  /**
   * Transform risk distribution for pie chart
   */
  riskData: (data: RiskDistribution[]): PieChartData[] => {
    return data.map((item) => ({
      id: item.risk_level,
      label: `${item.risk_level} Risk`,
      value: item.count,
      color: RISK_COLORS[item.risk_level] || "#6b7280",
    }));
  },

  /**
   * Transform monthly trends for line chart
   */
  monthlyTrends: (data: MonthlyTrend[]): LineChartData[] => {
    return [
      {
        id: "Attrition",
        data: data.map((item) => ({
          x: item.month,
          y: item.attrition_count,
          name: item.month,
          value: item.attrition_count,
        })),
      },
      {
        id: "New Hires",
        data: data.map((item) => ({
          x: item.month,
          y: item.new_hires,
          name: item.month,
          value: item.new_hires,
        })),
      },
      {
        id: "Total Employees",
        data: data.map((item) => ({
          x: item.month,
          y: item.total_employees,
          name: item.month,
          value: item.total_employees,
        })),
      },
    ];
  },

  /**
   * Transform working model stats for pie chart
   */
  workingModelData: (
    data: Array<{ working_model: WorkingModel; count: number }>
  ): PieChartData[] => {
    return data.map((item) => ({
      id: item.working_model,
      label: item.working_model,
      value: item.count,
      color: WORKING_MODEL_COLORS[item.working_model] || "#6b7280",
    }));
  },
};

// Data validation utilities
export const dataValidators = {
  /**
   * Validate dashboard data structure
   */
  isDashboardDataValid: (data: any): data is DashboardData => {
    return (
      data &&
      typeof data === "object" &&
      data.employeeStats &&
      Array.isArray(data.departmentAnalytics) &&
      Array.isArray(data.riskDistribution)
    );
  },

  /**
   * Validate employee data
   */
  isEmployeeValid: (data: any): data is Employee => {
    return (
      data &&
      typeof data === "object" &&
      typeof data.employee_id === "number" &&
      typeof data.full_name === "string"
    );
  },

  /**
   * Validate pulse survey data
   */
  isPulseSurveyValid: (data: any): data is PulseSurvey => {
    return (
      data &&
      typeof data === "object" &&
      typeof data.survey_id === "number" &&
      typeof data.employee_id === "number"
    );
  },
};

// Data processing utilities
export const dataProcessors = {
  /**
   * Calculate health score from attrition rate
   */
  calculateHealthScore: (attritionRate: number): number => {
    // Convert attrition rate to health score (inverse relationship)
    const score = Math.max(0, Math.min(100, 100 - attritionRate * 2));
    return Math.round(score);
  },

  /**
   * Get health status based on score
   */
  getHealthStatus: (score: number): { label: string; variant: string } => {
    if (score >= 80) return { label: "Excellent", variant: "success" };
    if (score >= 60) return { label: "Good", variant: "default" };
    if (score >= 40) return { label: "Fair", variant: "warning" };
    return { label: "Needs Attention", variant: "destructive" };
  },

  /**
   * Calculate attrition risk level
   */
  getAttritionRiskLevel: (score: number): string => {
    if (score >= 0.7) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
  },

  /**
   * Format currency values
   */
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  /**
   * Format percentage values
   */
  formatPercentage: (value: number): string => {
    return `${value.toFixed(1)}%`;
  },

  /**
   * Format date strings
   */
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  /**
   * Calculate overall survey score
   */
  calculateSurveyScore: (survey: PulseSurvey): number => {
    const fields = [
      "work_life_balance",
      "job_satisfaction",
      "relationship_with_manager",
      "communication_effectiveness",
      "recognition_reward_sat",
      "career_growth_opportunities",
      "alignment_with_company_values",
      "perceived_fairness",
      "team_cohesion_support",
      "autonomy_at_work",
      "overall_engagement",
      "training_skill_dev_sat",
      "org_change_readiness",
      "feedback_usefulness",
      "flexibility_support",
      "perceived_job_security",
      "environment_satisfaction",
    ];

    const validScores = fields
      .map((field) => survey[field as keyof PulseSurvey])
      .filter(
        (score): score is number => typeof score === "number" && score > 0
      );

    if (validScores.length === 0) return 0;

    const average =
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  },

  /**
   * Get rating text from numeric value
   */
  getRatingText: (value: number): string => {
    const ratings = {
      1: "Strongly Disagree",
      2: "Disagree",
      3: "Neutral",
      4: "Agree",
      5: "Strongly Agree",
    };
    return ratings[value as keyof typeof ratings] || "N/A";
  },
};

// Safe data access utilities
export const safeAccess = {
  /**
   * Safely access nested object properties
   */
  get: <T>(obj: any, path: string, defaultValue: T): T => {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current == null || typeof current !== "object") {
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  },

  /**
   * Safely access array with fallback
   */
  array: <T>(value: any, fallback: T[] = []): T[] => {
    return Array.isArray(value) ? value : fallback;
  },

  /**
   * Safely access number with fallback
   */
  number: (value: any, fallback: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  },

  /**
   * Safely access string with fallback
   */
  string: (value: any, fallback: string = ""): string => {
    return typeof value === "string" ? value : fallback;
  },
};
