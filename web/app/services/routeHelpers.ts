import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { api, ApiError } from "~/services/api";
import { dataValidators } from "~/services/dataTransformers";

// Generic loader wrapper with error handling
export async function createLoader<T>(
  loaderFn: (args: LoaderFunctionArgs) => Promise<T>
) {
  return async (args: LoaderFunctionArgs) => {
    try {
      const data = await loaderFn(args);
      return { data, error: null };
    } catch (error) {
      console.error("Loader error:", error);
      const errorMessage =
        error instanceof ApiError ? error.message : "Failed to load data";
      return { data: null, error: errorMessage };
    }
  };
}

// Generic action wrapper with error handling
export async function createAction<T>(
  actionFn: (args: ActionFunctionArgs) => Promise<T>
) {
  return async (args: ActionFunctionArgs) => {
    try {
      const result = await actionFn(args);
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error("Action error:", error);
      const errorMessage =
        error instanceof ApiError ? error.message : "Operation failed";
      return { success: false, data: null, error: errorMessage };
    }
  };
}

// Dashboard loader
export const dashboardLoader = createLoader(async () => {
  const data = await api.analytics.getDashboard();

  if (!dataValidators.isDashboardDataValid(data)) {
    throw new Error("Invalid dashboard data received");
  }

  return data;
});

// Employee detail loader
export const employeeDetailLoader = createLoader(async ({ params }) => {
  const { employeeId } = params;

  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  const [employee, pulseSurvey] = await Promise.allSettled([
    api.employees.getById(employeeId),
    api.pulseSurveys.getByEmployee(employeeId),
  ]);

  return {
    employee: employee.status === "fulfilled" ? employee.value : null,
    pulseSurvey: pulseSurvey.status === "fulfilled" ? pulseSurvey.value : null,
    employeeError:
      employee.status === "rejected" ? employee.reason.message : null,
    surveyError:
      pulseSurvey.status === "rejected" ? pulseSurvey.reason.message : null,
  };
});

// Survey detail loader
export const surveyDetailLoader = createLoader(async ({ params }) => {
  const { employeeId } = params;

  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  const [survey, employee] = await Promise.allSettled([
    api.pulseSurveys.getByEmployee(employeeId),
    api.employees.getById(employeeId),
  ]);

  return {
    survey: survey.status === "fulfilled" ? survey.value : null,
    employee: employee.status === "fulfilled" ? employee.value : null,
    surveyError: survey.status === "rejected" ? survey.reason.message : null,
    employeeError:
      employee.status === "rejected" ? employee.reason.message : null,
  };
});

 // Data management loader
export const dataManagementLoader = createLoader(async ({ request }) => {
  const url = new URL(request.url);
  const employeePage = url.searchParams.get("employeePage") || "1";
  const surveyPage = url.searchParams.get("surveyPage") || "1";
  const limit = url.searchParams.get("limit") || "10";
  const employeeSearch = url.searchParams.get("employeeSearch") || "";
  const surveySearch = url.searchParams.get("surveySearch") || "";

  const [employeesResult, surveysResult] = await Promise.allSettled([
    api.employees.getAll({
      page: employeePage,
      limit,
      search: employeeSearch
    }),
    api.pulseSurveys.getAll({
      page: surveyPage,
      limit,
      search: surveySearch
    }),
  ]);

  return {
    employees:
      employeesResult.status === "fulfilled"
        ? employeesResult.value
        : { employees: [], pagination: { currentPage: 1, totalPages: 1, totalEmployees: 0, limit: parseInt(limit) } },
    surveys:
      surveysResult.status === "fulfilled"
        ? surveysResult.value
        : { surveys: [], pagination: { currentPage: 1, totalPages: 1, totalSurveys: 0, limit: parseInt(limit) } },
    employeesError:
      employeesResult.status === "rejected"
        ? employeesResult.reason.message
        : null,
    surveysError:
      surveysResult.status === "rejected" ? surveysResult.reason.message : null,
  };
});

// Analytics loader
export const analyticsLoader = createLoader(async ({ request }) => {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "6months";

  const [
    dashboard,
    attritionTrends,
    departmentComparison,
    employeeSegmentation,
    predictiveInsights,
  ] = await Promise.allSettled([
    api.analytics.getDashboard(),
    api.analytics.getAttritionTrends(period),
    api.analytics.getDepartmentComparison(),
    api.analytics.getEmployeeSegmentation(),
    api.analytics.getPredictiveInsights(),
  ]);

  return {
    dashboard: dashboard.status === "fulfilled" ? dashboard.value : null,
    attritionTrends:
      attritionTrends.status === "fulfilled" ? attritionTrends.value : [],
    departmentComparison:
      departmentComparison.status === "fulfilled"
        ? departmentComparison.value
        : [],
    employeeSegmentation:
      employeeSegmentation.status === "fulfilled"
        ? employeeSegmentation.value
        : null,
    predictiveInsights:
      predictiveInsights.status === "fulfilled"
        ? predictiveInsights.value
        : null,
    errors: {
      dashboard:
        dashboard.status === "rejected" ? dashboard.reason.message : null,
      attritionTrends:
        attritionTrends.status === "rejected"
          ? attritionTrends.reason.message
          : null,
      departmentComparison:
        departmentComparison.status === "rejected"
          ? departmentComparison.reason.message
          : null,
      employeeSegmentation:
        employeeSegmentation.status === "rejected"
          ? employeeSegmentation.reason.message
          : null,
      predictiveInsights:
        predictiveInsights.status === "rejected"
          ? predictiveInsights.reason.message
          : null,
    },
  };
});

// Generic CRUD action
export const crudAction = createAction(async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const type = formData.get("type") as string;
  const id = formData.get("id") as string;

  // Parse JSON data if present
  const dataString = formData.get("data") as string;
  const data = dataString ? JSON.parse(dataString) : {};

  switch (action) {
    case "create":
      if (type === "employee") {
        return await api.employees.create(data);
      } else if (type === "survey") {
        return await api.pulseSurveys.create(data);
      }
      break;

    case "update":
      if (type === "employee") {
        return await api.employees.update(id, data);
      } else if (type === "survey") {
        return await api.pulseSurveys.update(id, data);
      }
      break;

    case "delete":
      if (type === "employee") {
        return await api.employees.delete(id);
      } else if (type === "survey") {
        return await api.pulseSurveys.delete(id);
      }
      break;

    case "bulkDelete":
      const ids = JSON.parse(formData.get("ids") as string);
      if (type === "employee") {
        // Delete all employees in parallel
        await Promise.all(ids.map((id: string) => api.employees.delete(id)));
        return { success: true, deletedCount: ids.length };
      } else if (type === "survey") {
        // Delete all surveys in parallel
        await Promise.all(ids.map((id: string) => api.pulseSurveys.delete(id)));
        return { success: true, deletedCount: ids.length };
      }
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  throw new Error(`Invalid action/type combination: ${action}/${type}`);
});

// Route metadata generators
export const createMeta = (title: string, description?: string) => {
  return () => [
    { title: `${title} - AttriSense` },
    {
      name: "description",
      content: description || "AttriSense - AI-powered employee attrition prediction and retention analytics",
    },
  ];
};
