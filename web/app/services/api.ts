import type {
  AttritionTrend,
  DashboardData,
  DepartmentComparison,
  Employee,
  EmployeeSegmentation,
  PaginatedResponse,
  PredictiveInsights,
  PulseSurvey,
} from "~/lib/interface";

// API Configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.API_URL || "https://api.yourdomain.com"
    : "http://localhost:5000";

const ML_API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.ML_API_URL || "https://ml-api.yourdomain.com"
    : "http://localhost:8000";

const API_ENDPOINTS = {
  // Analytics
  DASHBOARD: "/api/analytics/dashboard",
  ATTRITION_TRENDS: "/api/analytics/attrition-trends",
  DEPARTMENT_COMPARISON: "/api/analytics/department-comparison",
  EMPLOYEE_SEGMENTATION: "/api/analytics/employee-segmentation",
  PREDICTIVE_INSIGHTS: "/api/analytics/predictive-insights",
  EMPLOYEE_ANALYTICS: (id: string | number) => `/api/analytics/employee/${id}`,
  SHAP_ANALYSIS: "/api/analytics/shap",
  TIME_TRENDS: "/api/analytics/trends",
  DEPARTMENT_DEEP_DIVE: (dept: string) => `/api/analytics/department/${dept}/details`,
  RETENTION_RECOMMENDATIONS: (id: string | number) => `/api/analytics/recommendations/${id}`,

  // Employees
  EMPLOYEES: "/api/employees",
  EMPLOYEE_BY_ID: (id: string | number) => `/api/employees/${id}`,
  EMPLOYEE_STATS: "/api/employees/stats",
  DEPARTMENT_STATS: "/api/employees/department-stats",

  // Pulse Surveys
  PULSE_SURVEYS: "/api/pulse-surveys",
  PULSE_SURVEY_BY_ID: (id: string | number) => `/api/pulse-surveys/${id}`,
  PULSE_SURVEYS_BY_EMPLOYEE: (employeeId: string | number) =>
    `/api/pulse-surveys/employee/${employeeId}`,
  PULSE_SURVEY_STATS: "/api/pulse-surveys/stats",

  // Attrition Scores
  ATTRITION_SCORES: "/api/attrition-scores",
  ATTRITION_SCORE_BY_ID: (id: string | number) => `/api/attrition-scores/${id}`,
  ATTRITION_SCORES_BY_EMPLOYEE: (employeeId: string | number) =>
    `/api/attrition-scores/employee/${employeeId}`,
} as const;

 // ML API Endpoints
 const ML_ENDPOINTS = {
   PREDICT: "/predict",
   PREDICT_BATCH: "/predict_batch",
   SURVEY_PREDICT: "/survey_predict",
   SURVEY_PREDICT_BATCH: "/survey_predict_batch",
   SHAP_SUMMARY: "/shap/summary",
   SHAP_FEATURE_IMPORTANCE: "/shap/feature_importance",
   SHAP_SURVEY_FEATURE_IMPORTANCE: "/shap/survey/feature_importance",
   // Changed to use query parameters to handle feature names with special characters (e.g., slashes)
   SHAP_DEPENDENCE: (feature: string) => `/shap/dependence?feature=${encodeURIComponent(feature)}`,
   SHAP_SURVEY_DEPENDENCE: (feature: string) => `/shap/survey/dependence?feature=${encodeURIComponent(feature)}`,
   SHAP_FORCE_PLOT: "/shap/force_plot",
   SHAP_WATERFALL: "/shap/waterfall",
   SHAP_SURVEY_WATERFALL: "/shap/survey/waterfall",
   SHAP_DECISION_PLOT: "/shap/decision_plot",
   SHAP_SURVEY_SUMMARY: "/shap/survey/summary",
   SHAP_SURVEY_FORCE: "/shap/survey/force_plot",
   FEATURES: "/features",
   HEALTH: "/health",
 } as const;

// Request configuration
interface RequestConfig extends RequestInit {
  timeout?: number;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic API request function with error handling and timeout
async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { timeout = 10000, ...requestConfig } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestConfig,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...requestConfig.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `HTTP error! status: ${response.status}`,
        response.status,
        response
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof ApiError && error.name === "AbortError") {
      throw new ApiError("Request timeout", 408);
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0
    );
  }
}

// Analytics API
export const analyticsApi = {
  getDashboard: (): Promise<DashboardData> =>
    apiRequest(API_ENDPOINTS.DASHBOARD),

  getAttritionTrends: (period?: string): Promise<AttritionTrend[]> =>
    apiRequest(
      `${API_ENDPOINTS.ATTRITION_TRENDS}${period ? `?period=${period}` : ""}`
    ),

  getDepartmentComparison: (): Promise<DepartmentComparison[]> =>
    apiRequest(API_ENDPOINTS.DEPARTMENT_COMPARISON),

  getEmployeeSegmentation: (): Promise<EmployeeSegmentation> =>
    apiRequest(API_ENDPOINTS.EMPLOYEE_SEGMENTATION),

  getPredictiveInsights: (): Promise<PredictiveInsights> =>
    apiRequest(API_ENDPOINTS.PREDICTIVE_INSIGHTS),
};

// Employee API
 // Employee API
export const employeeApi = {
  getAll: (
    params?: Record<string, any>
  ): Promise<PaginatedResponse<Employee>> => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest(
      `${API_ENDPOINTS.EMPLOYEES}${searchParams ? `?${searchParams}` : ""}`
    );
  },

  search: (query: string, limit: number = 5): Promise<Employee[]> => {
    const searchParams = new URLSearchParams({
      search: query,
      limit: limit.toString()
    }).toString();
    return apiRequest<PaginatedResponse<Employee>>(
      `${API_ENDPOINTS.EMPLOYEES}?${searchParams}`
    ).then(response => response.data || []);
  },

  getById: (id: string | number): Promise<Employee> =>
    apiRequest(API_ENDPOINTS.EMPLOYEE_BY_ID(id)),

  create: (data: Partial<Employee>): Promise<Employee> =>
    apiRequest(API_ENDPOINTS.EMPLOYEES, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string | number, data: Partial<Employee>): Promise<Employee> =>
    apiRequest(API_ENDPOINTS.EMPLOYEE_BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string | number): Promise<void> =>
    apiRequest(API_ENDPOINTS.EMPLOYEE_BY_ID(id), {
      method: "DELETE",
    }),

  getStats: (): Promise<any> => apiRequest(API_ENDPOINTS.EMPLOYEE_STATS),

  getDepartmentStats: (): Promise<any[]> =>
    apiRequest(API_ENDPOINTS.DEPARTMENT_STATS),
};

// Pulse Survey API
export const pulseSurveyApi = {
  getAll: (
    params?: Record<string, any>
  ): Promise<PaginatedResponse<PulseSurvey>> => {
    const searchParams = new URLSearchParams(params).toString();
    return apiRequest(
      `${API_ENDPOINTS.PULSE_SURVEYS}${searchParams ? `?${searchParams}` : ""}`
    );
  },

  getById: (id: string | number): Promise<PulseSurvey> =>
    apiRequest(API_ENDPOINTS.PULSE_SURVEY_BY_ID(id)),

  getByEmployee: (employeeId: string | number): Promise<PulseSurvey> =>
    apiRequest(API_ENDPOINTS.PULSE_SURVEYS_BY_EMPLOYEE(employeeId)),

  create: (data: Partial<PulseSurvey>): Promise<PulseSurvey> =>
    apiRequest(API_ENDPOINTS.PULSE_SURVEYS, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string | number,
    data: Partial<PulseSurvey>
  ): Promise<PulseSurvey> =>
    apiRequest(API_ENDPOINTS.PULSE_SURVEY_BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string | number): Promise<void> =>
    apiRequest(API_ENDPOINTS.PULSE_SURVEY_BY_ID(id), {
      method: "DELETE",
    }),

  getStats: (): Promise<any> => apiRequest(API_ENDPOINTS.PULSE_SURVEY_STATS),
};

// Export API_BASE_URL and API_ENDPOINTS for use in other files
export { API_BASE_URL, API_ENDPOINTS, ML_API_BASE_URL, ML_ENDPOINTS };


// ML API request function
async function mlApiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { timeout = 30000, ...requestConfig } = config; // Longer timeout for ML operations

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${ML_API_BASE_URL}${endpoint}`, {
      ...requestConfig,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...requestConfig.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `ML API error! status: ${response.status}`,
        response.status,
        response
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("ML API request timeout", 408);
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Unknown ML API error occurred",
      0
    );
  }
}

// ML API for predictions and SHAP analysis
export const mlApi = {
  // Predictions
  predict: (employeeData: any): Promise<any> =>
    mlApiRequest(ML_ENDPOINTS.PREDICT, {
      method: "POST",
      body: JSON.stringify(employeeData),
    }),

  predictBatch: (employeesData: any[]): Promise<any[]> =>
    mlApiRequest(ML_ENDPOINTS.PREDICT_BATCH, {
      method: "POST",
      body: JSON.stringify(employeesData),
    }),

  surveyPredict: (surveyData: any): Promise<any> =>
    mlApiRequest(ML_ENDPOINTS.SURVEY_PREDICT, {
      method: "POST",
      body: JSON.stringify(surveyData),
    }),

  surveyPredictBatch: (surveysData: any[]): Promise<any[]> =>
    mlApiRequest(ML_ENDPOINTS.SURVEY_PREDICT_BATCH, {
      method: "POST",
      body: JSON.stringify(surveysData),
    }),

  // SHAP Visualizations
  getShapSummary: (): Promise<{ plot_type: string; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_SUMMARY),

  getFeatureImportance: (): Promise<{ plot_type: string; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_FEATURE_IMPORTANCE),

  getDependencePlot: (feature: string): Promise<{ plot_type: string; feature: string; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_DEPENDENCE(feature)),

  getForcePlot: (employeeData: any): Promise<{ plot_type: string; employee_id: number; image: string; format: string; base_value: number; prediction: number }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_FORCE_PLOT, {
      method: "POST",
      body: JSON.stringify(employeeData),
    }),

  getWaterfallPlot: (employeeData: any): Promise<{ plot_type: string; employee_id: number; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_WATERFALL, {
      method: "POST",
      body: JSON.stringify(employeeData),
    }),

  getDecisionPlot: (employeesData: any[]): Promise<{ plot_type: string; num_employees: number; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_DECISION_PLOT, {
      method: "POST",
      body: JSON.stringify(employeesData),
    }),

  // Survey SHAP
  getSurveySummary: (): Promise<{ plot_type: string; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_SURVEY_SUMMARY),

  getSurveyFeatureImportance: (): Promise<{ plot_type: string; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_SURVEY_FEATURE_IMPORTANCE),

  getSurveyDependencePlot: (feature: string): Promise<{ plot_type: string; feature: string; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_SURVEY_DEPENDENCE(feature)),

  getSurveyForcePlot: (surveyData: any): Promise<{ plot_type: string; employee_id: number; image: string; format: string; base_value: number; prediction: number }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_SURVEY_FORCE, {
      method: "POST",
      body: JSON.stringify(surveyData),
    }),

  getSurveyWaterfallPlot: (surveyData: any): Promise<{ plot_type: string; employee_id: number; image: string; format: string }> =>
    mlApiRequest(ML_ENDPOINTS.SHAP_SURVEY_WATERFALL, {
      method: "POST",
      body: JSON.stringify(surveyData),
    }),

  // Utility
  getFeatures: (): Promise<{
    employee_features: string[];
    survey_features: string[];
    employee_display_names?: string[];
    survey_display_names?: string[];
  }> =>
    mlApiRequest(ML_ENDPOINTS.FEATURES),

  healthCheck: (): Promise<{ status: string; model: string; features: any }> =>
    mlApiRequest(ML_ENDPOINTS.HEALTH),
};

// Enhanced Analytics API with new endpoints
export const enhancedAnalyticsApi = {
  ...analyticsApi,

  getEmployeeAnalytics: (employeeId: string | number): Promise<any> =>
    apiRequest(API_ENDPOINTS.EMPLOYEE_ANALYTICS(employeeId)),

  getShapAnalysis: (params?: { type?: string; employeeId?: string }): Promise<any> => {
    const searchParams = new URLSearchParams(params as any).toString();
    return apiRequest(
      `${API_ENDPOINTS.SHAP_ANALYSIS}${searchParams ? `?${searchParams}` : ""}`
    );
  },

  getTimeTrends: (period?: string): Promise<any> =>
    apiRequest(
      `${API_ENDPOINTS.TIME_TRENDS}${period ? `?period=${period}` : ""}`
    ),

  getDepartmentDeepDive: (department: string): Promise<any> =>
    apiRequest(API_ENDPOINTS.DEPARTMENT_DEEP_DIVE(department)),

  getRetentionRecommendations: (employeeId: string | number): Promise<any> =>
    apiRequest(API_ENDPOINTS.RETENTION_RECOMMENDATIONS(employeeId)),
};

// Export all APIs
export const api = {
  analytics: enhancedAnalyticsApi,
  employees: employeeApi,
  pulseSurveys: pulseSurveyApi,
  ml: mlApi,
};
