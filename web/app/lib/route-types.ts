import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { DashboardData, Employee, PulseSurvey } from "./interface";

// Common loader data types
export interface BaseLoaderData<T = any> {
  data: T | null;
  error?: string;
  loading?: boolean;
}

export interface DashboardLoaderData extends BaseLoaderData<DashboardData> {}

export interface EmployeeDetailLoaderData
  extends BaseLoaderData<{
    employee: Employee;
    surveys: PulseSurvey[];
  }> {}

export interface DataManagementLoaderData
  extends BaseLoaderData<{
    employees: Employee[];
    surveys: PulseSurvey[];
    employeePagination: {
      currentPage: number;
      totalPages: number;
      totalEmployees: number;
      limit: number;
    };
    surveyPagination: {
      currentPage: number;
      totalPages: number;
      totalSurveys: number;
      limit: number;
    };
    stats: {
      total_employees: number;
      active_employees: number;
      attrited_employees: number;
      attrition_rate: number;
      avg_salary: number;
      avg_age: number;
      avg_tenure: number;
      avg_performance: number;
      high_risk_count: number;
      medium_risk_count: number;
      low_risk_count: number;
    };
    filters: {
      employee: {
        search?: string;
        department?: string;
        working_model?: string;
        attrition_risk?: string;
        sort_by: string;
        sort_order: string;
      };
      survey: {
        search?: string;
        department?: string;
        sort_by: string;
        sort_order: string;
      };
    };
  }> {}

export interface SurveyDetailLoaderData
  extends BaseLoaderData<{
    survey: PulseSurvey;
    employee: Employee;
  }> {}

// Common action data types
export interface BaseActionData<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Route parameter types
export interface EmployeeParams {
  employeeId: string;
}

export interface SurveyParams {
  employeeId: string;
}

// Meta function types
export interface MetaFunction {
  title: string;
  description?: string;
  keywords?: string[];
}

// Common route exports interface
export interface RouteModule<TLoaderData = any, TActionData = any> {
  meta?: () => Array<{ title?: string; name?: string; content?: string }>;
  loader?: (args: LoaderFunctionArgs) => Promise<TLoaderData>;
  action?: (args: ActionFunctionArgs) => Promise<TActionData>;
  default: React.ComponentType<any>;
}
