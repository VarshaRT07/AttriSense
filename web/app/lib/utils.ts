import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DepartmentAnalytics } from "./interface";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const transformDepartmentData = (
  departmentAnalytics: DepartmentAnalytics[]
): any => {
  return departmentAnalytics.map((dept) => ({
    department: dept.department,
    attritionRate: dept.attrition_rate,
    totalEmployees: dept.total_employees,
    attritionCount: dept.attrited_employees,
  }));
};

export const transformRiskData = (riskDistribution: any[]): any[] => {
  return riskDistribution.map((risk) => ({
    id: `${risk.risk_level} Risk`,
    label: `${risk.risk_level} Risk`,
    value: risk.count,
    color:
      risk.risk_level === "High"
        ? "#ef4444"
        : risk.risk_level === "Medium"
          ? "#f59e0b"
          : "#10b981",
  }));
};

export const getHealthStatus = (
  attritionRate: number
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} => {
  if (attritionRate < 10) return { label: "Excellent", variant: "default" };
  if (attritionRate < 15) return { label: "Good", variant: "secondary" };
  if (attritionRate < 20) return { label: "Fair", variant: "outline" };
  return { label: "Needs Attention", variant: "destructive" };
};

export const calculateHealthScore = (attritionRate: number): number => {
  return Math.max(0, Math.min(100, Math.round(100 - attritionRate)));
};
