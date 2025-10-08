import { AlertTriangle, Eye, Filter, Users, X } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useActionData,
  useNavigation,
  useRevalidator,
  useSubmit,
} from "react-router";
import { Layout } from "~/components/Layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CreateEmployeeModal } from "~/components/ui/create-employee";
import { DataTable, type Column } from "~/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { MetricCard } from "~/components/ui/metric-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { Employee, PulseSurvey } from "~/lib/interface";
import { crudAction, dataManagementLoader } from "~/lib/route-loaders";
import { createMeta } from "~/lib/route-utils";
import type { Route } from "./+types/data-management";

export const meta = createMeta({
  title: "Data Management - AttriSense",
  description:
    "Manage employee data and pulse surveys with AI-powered insights",
  keywords: ["data management", "employees", "surveys", "HR", "AttriSense"],
});

// Loader and action
export const loader = dataManagementLoader;
export const action = crudAction;

// Types for action data
interface ActionData {
  success: boolean;
  data?: {
    success: boolean;
    message?: string;
    error?: string;
    type?:
      | "upload"
      | "delete"
      | "create"
      | "bulkDelete"
      | "createWithPrediction";
    uploadProgress?: {
      stage: "parsing" | "predicting" | "saving" | "complete";
      message: string;
      percentage: number;
    };
  };
  // Direct properties for backward compatibility
  message?: string;
  error?: string;
  type?: "upload" | "delete" | "create" | "bulkDelete" | "createWithPrediction";
  uploadProgress?: {
    stage: "parsing" | "predicting" | "saving" | "complete";
    message: string;
    percentage: number;
  };
}

const ATTRITION_RISKS = ["All Risk Levels", "High", "Medium", "Low"];

const employeeColumns: Column<Employee>[] = [
  {
    key: "employee_id",
    header: "Employee ID",
    type: "number",
    sortable: true,
    width: "80px",
  },
  {
    key: "full_name",
    header: "Name",
    type: "text",
    sortable: true,
    filterable: true,
  },
  {
    key: "department",
    header: "Department",
    type: "select",
    sortable: true,
    filterable: true,
  },
  {
    key: "job_role",
    header: "Job Role",
    type: "text",
    sortable: true,
    filterable: true,
  },
  {
    key: "attrition_score",
    header: "Attrition Score",
    type: "number",
    sortable: true,
    render: (value) => {
      const score = value || 0;
      const color =
        score > 0.7
          ? "text-red-600"
          : score > 0.4
            ? "text-yellow-600"
            : "text-green-600";
      return <span className={color}>{score}</span>;
    },
  },
  {
    key: "attrition_score",
    header: "Attrition Risk",
    type: "number",
    sortable: true,
    render: (value) => {
      const score = value || 0;
      const risk = score > 0.7 ? "High" : score > 0.4 ? "Medium" : "Low";
      const color =
        score > 0.7
          ? "text-red-600"
          : score > 0.4
            ? "text-yellow-600"
            : "text-green-600";
      return <span className={color}>{risk}</span>;
    },
  },
  {
    key: "employee_id",
    header: "View",
    type: "custom",
    render: (_, row) => (
      <Link to={`/employees/${row.employee_id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
];

const surveyColumns: Column<PulseSurvey>[] = [
  {
    key: "survey_id",
    header: "Survey ID",
    type: "number",
    sortable: true,
    width: "100px",
  },
  {
    key: "full_name",
    header: "Employee",
    type: "text",
    sortable: true,
    filterable: true,
  },
  {
    key: "department",
    header: "Department",
    type: "select",
    options: ["HR", "Engineering", "Sales", "Marketing", "Finance"],
    sortable: true,
    filterable: true,
  },
  {
    key: "survey_date",
    header: "Survey Date",
    type: "date",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: "attrition_score",
    header: "Attrition Score",
    type: "number",
    sortable: true,
    render: (value) => {
      const score = value || 0;
      const color =
        score > 0.7
          ? "text-red-600"
          : score > 0.4
            ? "text-yellow-600"
            : "text-green-600";
      return <span className={color}>{score}</span>;
    },
  },
  {
    key: "attrition_score",
    header: "Attrition Risk",
    type: "number",
    sortable: true,
    render: (value) => {
      const score = value || 0;
      const risk = score > 0.7 ? "High" : score > 0.4 ? "Medium" : "Low";
      const color =
        score > 0.7
          ? "text-red-600"
          : score > 0.4
            ? "text-yellow-600"
            : "text-green-600";
      return <span className={color}>{risk}</span>;
    },
  },
  {
    key: "employee_id",
    header: "View",
    type: "custom",
    render: (_, row) => (
      <Link to={`/surveys/${row.employee_id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
  },
];

export default function DataManagement({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { employees, surveys, stats } = data;
  const [showCreateEmployeeModal, setShowCreateEmployeeModal] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const rawActionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const revalidator = useRevalidator();

  const actionData = rawActionData?.data || rawActionData;
  const [selectedAttritionRisk, setSelectedAttritionRisk] =
    useState("All Risk Levels");

  // Track active tab - initialize from URL or default to employees
  const [activeTab, setActiveTab] = useState<"employees" | "surveys">(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get("tab");
      return urlTab === "surveys" ? "surveys" : "employees";
    }
    return "employees";
  });

  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [currentSurveyPage, setCurrentSurveyPage] = useState(1);
  const [pageSize] = useState(10);

  const isLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlAttritionRisk = searchParams.get("attrition_risk");
    const urlTab = searchParams.get("tab");

    if (urlAttritionRisk) setSelectedAttritionRisk(urlAttritionRisk);
    if (urlTab === "surveys" || urlTab === "employees") {
      setActiveTab(urlTab);
    }
  }, []);

  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    if (selectedAttritionRisk !== "All Risk Levels") {
      filtered = filtered.filter((emp) => {
        const score = emp.attrition_score || 0;
        switch (selectedAttritionRisk) {
          case "High":
            return score > 0.7;
          case "Medium":
            return score >= 0.4 && score <= 0.7;
          case "Low":
            return score < 0.4;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [employees, selectedAttritionRisk]);

  const filteredSurveys = useMemo(() => {
    let filtered = [...surveys];

    if (selectedAttritionRisk !== "All Risk Levels") {
      filtered = filtered.filter((emp) => {
        const score = emp.attrition_score || 0;
        switch (selectedAttritionRisk) {
          case "High":
            return score > 0.7;
          case "Medium":
            return score >= 0.4 && score <= 0.7;
          case "Low":
            return score < 0.4;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [surveys, selectedAttritionRisk]);

  // Calculate pagination info
  const employeePaginationInfo = useMemo(
    () => ({
      currentPage: currentEmployeePage,
      totalPages: Math.ceil(filteredEmployees.length / pageSize),
      totalEmployees: filteredEmployees.length,
      limit: pageSize,
    }),
    [filteredEmployees.length, currentEmployeePage, pageSize]
  );

  const surveyPaginationInfo = useMemo(
    () => ({
      currentPage: currentSurveyPage,
      totalPages: Math.ceil(filteredSurveys.length / pageSize),
      totalSurveys: filteredSurveys.length,
      limit: pageSize,
    }),
    [filteredSurveys.length, currentSurveyPage, pageSize]
  );

  useEffect(() => {
    setCurrentEmployeePage(1);
  }, [selectedAttritionRisk]);

  const clearAllFilters = useCallback(() => {
    setSelectedAttritionRisk("All Risk Levels");
    setCurrentEmployeePage(1);
    setCurrentSurveyPage(1);
  }, []);

  // Handle tab change and update URL
  const handleTabChange = useCallback((value: string) => {
    const newTab = value as "employees" | "surveys";
    setActiveTab(newTab);

    // Update URL without reloading the page
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", newTab);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${searchParams.toString()}`
    );
  }, []);

  const hasActiveFilters = useMemo(() => {
    return selectedAttritionRisk !== "All Risk Levels";
  }, [selectedAttritionRisk]);

  const [uploading, setUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    stage: "parsing" | "predicting" | "saving" | "complete";
    message: string;
    percentage: number;
  } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "employee" | "survey";
    id?: string | number;
    ids?: (string | number)[];
    isBulk: boolean;
  } | null>(null);

  useEffect(() => {
    if (actionData) {
      if (actionData.type === "upload") {
        if (actionData.success) {
          setUploadResponse(
            actionData.message || "Upload completed successfully!"
          );
          setUploadProgress({
            stage: "complete",
            message: "Upload completed!",
            percentage: 100,
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setUploadResponse(actionData.error || "Upload failed");
          setUploadProgress(null);
        }
        setUploading(false);
      }
    }
  }, [actionData]);
  console.log(actionData, "ActionData");

  const handleExportEmployees = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/employees/export"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employees export data");
      }
      const data = await response.json();

      const csv = Papa.unparse(data.employees);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "employees_export.csv");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Employee export failed:", error);
    }
  };

  const handleExportSurvey = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/pulse-surveys/export"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch survey export data");
      }
      const data = await response.json();

      const csv = Papa.unparse(data.survey);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "survey_export.csv");
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Survey export failed:", error);
    }
  };

  const handleEmployeeCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Starting CSV upload for file:", file.name);

    revalidator.revalidate();

    setUploading(true);
    setUploadResponse(null);
    setShowUploadDialog(true);
    setUploadProgress({
      stage: "parsing",
      message: "Parsing CSV file...",
      percentage: 10,
    });

    try {
      // Parse CSV file
      const csvData: Partial<Employee>[] = await new Promise(
        (resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length) {
                reject(
                  new Error(`CSV parsing error: ${results.errors[0].message}`)
                );
              } else {
                resolve(results.data as Partial<Employee>[]);
              }
            },
            error: (error) => reject(error),
          });
        }
      );

      console.log("CSV parsed successfully, records:", csvData.length);
      setUploadProgress({
        stage: "predicting",
        message: `Validating ${csvData.length} records and generating predictions...`,
        percentage: 40,
      });

      // Create FormData for action
      const formData = new FormData();
      formData.append("action", "csvUpload");
      formData.append("type", "employee");
      formData.append("csvData", JSON.stringify(csvData));

      console.log("Submitting form data to action...");

      setUploadProgress({
        stage: "saving",
        message: "Saving employee data to database...",
        percentage: 70,
      });

      // Preserve the current tab in the URL when submitting
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("tab", activeTab);

      // Submit to action
      submit(formData, {
        method: "post",
        action: `?${searchParams.toString()}`,
      });

      // The completion will be handled by the useEffect watching actionData
    } catch (error: any) {
      console.error("CSV upload error:", error);
      setUploadResponse(`Upload failed: ${error.message || error}`);
      setUploadProgress(null);
      setUploading(false);
    }

    // Reset file input
    if (event.target) {
      (event.target as HTMLInputElement).value = "";
    }
  };

  const handleEmployeeDelete = useCallback(async (id: string | number) => {
    // Show confirmation dialog instead of deleting immediately
    setDeleteTarget({ type: "employee", id, isBulk: false });
    setShowDeleteDialog(true);
  }, []);

  const handleEmployeeBulkDelete = useCallback(
    async (ids: (string | number)[]) => {
      // Show confirmation dialog for bulk delete
      setDeleteTarget({ type: "employee", ids, isBulk: true });
      setShowDeleteDialog(true);
    },
    []
  );

  const [createProgress, setCreateProgress] = useState<{
    stage: "validating" | "predicting" | "saving" | "complete";
    message: string;
    percentage: number;
  } | null>(null);
  const [createResponse, setCreateResponse] = useState<string | null>(null);

  const handleEmployeeCreate = useCallback(async (data: Partial<Employee>) => {
    console.log("=== EMPLOYEE CREATION DEBUG ===");
    console.log("Original form data:", data);

    setIsCreatingEmployee(true);
    setCreateResponse(null);
    setCreateProgress({
      stage: "validating",
      message: "Validating employee data...",
      percentage: 20,
    });

    try {
      // Stage 1: Validate input...

      // Stage 2: Generate predictions
      setCreateProgress({
        stage: "predicting",
        message: "Generating attrition predictions...",
        percentage: 50,
      });

      const mapGender = (gender: string | undefined): string => {
        if (!gender) return "O";
        switch (gender.toLowerCase()) {
          case "male":
            return "M";
          case "female":
            return "F";
          case "other":
            return "O";
          default:
            return "O";
        }
      };

      // Data for ML model
      const mlModelData = {
        "Employee ID": data.employee_id || 999,
        "Full Name": data.full_name || "",
        Age: Number(data.age) || 0,
        Gender: mapGender(data.gender),
        "Years of experience": Number(data.years_of_experience) || 0,
        "Job Role": data.job_role || "",
        Salary: Number(data.salary) || 0,
        "Performance Rating": Math.round(Number(data.performance_rating)) || 0,
        "Number of Promotions": Number(data.number_of_promotions) || 0,
        Overtime: data.overtime ? "Yes" : "No", // ML expects Yes/No
        "Commuting distance": Number(data.commuting_distance) || 0,
        "Education Level": data.education_level || "",
        "Marital Status": data.marital_status || "",
        "Number of Dependents": Number(data.number_of_dependents) || 0,
        "Job Level": Number(data.job_level) || 0,
        "Last hike": Number(data.last_hike) || 0,
        "Years in current role": Number(data.years_in_current_role) || 0,
        "Working model": data.working_model || "",
        "Working hours": Number(data.working_hours) || 40,
        Department: data.department || "",
        "No. of companies worked previously":
          Number(data.no_of_companies_worked_previously) || 0,
        LeavesTaken: Number(data.leaves_taken) || 0,
        YearsWithCompany: Number(data.years_with_company) || 0,
      };

      console.log("=== DATA SENT TO ML MODEL ===", mlModelData);

      const predictionResponse = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(mlModelData),
      });

      const responseText = await predictionResponse.text();
      if (!predictionResponse.ok) {
        throw new Error(`ML Model Error: ${responseText}`);
      }

      const prediction = JSON.parse(responseText);
      console.log("Parsed prediction:", prediction);

      // Stage 3: Save to DB
      setCreateProgress({
        stage: "saving",
        message: "Saving employee to database...",
        percentage: 80,
      });

      // 🔑 Merge form data + prediction for backend
      const finalEmployeeData = {
        employee_id: data.employee_id || 999,
        ...data, // original form fields
        attrition_score: prediction.attrition_probability || 0.5,
        attrition: (prediction.attrition_probability || 0) > 0.5 ? 1 : 0, // force integer
        top_positive_contributors: prediction.top_positive_contributors || [],
        top_negative_contributors: prediction.top_negative_contributors || [],
      };

      console.log("Saving employee to database:", finalEmployeeData);

      // // Send clean JSON (not FormData unless required by your router)
      // await fetch("/api/employees", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ employeeData: finalEmployeeData }),
      // });
      const formData = new FormData();
      formData.append("action", "create");
      formData.append("type", "employee");
      formData.append("employeeData", JSON.stringify(finalEmployeeData));

      // Preserve the current tab in the URL when submitting
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("tab", activeTab);

      submit(formData, {
        method: "post",
        action: `?${searchParams.toString()}`,
      });

      setCreateProgress({
        stage: "complete",
        message: "Employee created successfully!",
        percentage: 100,
      });
      setCreateResponse("Employee created successfully!");
      setIsCreatingEmployee(false);
      setShowCreateEmployeeModal(false);
    } catch (error: any) {
      console.error("Employee creation error:", error);
      setCreateResponse(`Creation failed: ${error.message}`);
      setCreateProgress(null);
      setIsCreatingEmployee(false);
    }
  }, []);

  // Remove the useEffect since we're handling everything in the function
  // useEffect(() => {
  //   if (actionData?.success && actionData?.type === "create") {
  //     setShowCreateEmployeeModal(false);
  //     setIsCreatingEmployee(false);
  //   }
  // }, [actionData]);

  const handleSurveyDelete = useCallback(async (id: string | number) => {
    // Show confirmation dialog instead of deleting immediately
    setDeleteTarget({ type: "survey", id, isBulk: false });
    setShowDeleteDialog(true);
  }, []);

  const handleSurveyBulkDelete = useCallback(
    async (ids: (string | number)[]) => {
      // Show confirmation dialog for bulk delete
      setDeleteTarget({ type: "survey", ids, isBulk: true });
      setShowDeleteDialog(true);
    },
    []
  );

  // Handle confirmed deletion
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    const formData = new FormData();

    if (deleteTarget.isBulk) {
      formData.append("action", "bulkDelete");
      formData.append("type", deleteTarget.type);
      formData.append("ids", JSON.stringify(deleteTarget.ids));
    } else {
      formData.append("action", "delete");
      formData.append("type", deleteTarget.type);
      formData.append("id", deleteTarget.id!.toString());
    }

    // Preserve the current tab in the URL when submitting
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", activeTab);

    submit(formData, {
      method: "post",
      action: `?${searchParams.toString()}`,
    });

    setShowDeleteDialog(false);
    setDeleteTarget(null);
  }, [deleteTarget, submit, activeTab]);

  // Handle cancel deletion
  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  }, []);

  const handleSurveyCsvUploadViaAction = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Clear previous action data by revalidating
      revalidator.revalidate();

      setUploading(true);
      setShowUploadDialog(true);
      setUploadResponse(null);
      setUploadProgress({
        stage: "parsing",
        message: "Parsing CSV file...",
        percentage: 10,
      });

      try {
        const data: any[] = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length) {
                reject(results.errors);
              } else {
                resolve(results.data);
              }
            },
            error: (error) => reject(error),
          });
        });

        setUploadProgress({
          stage: "predicting",
          message: "Validating data and generating predictions...",
          percentage: 40,
        });

        // Submit to the crudAction
        const formData = new FormData();
        formData.append("action", "csvUpload");
        formData.append("type", "survey");
        formData.append("csvData", JSON.stringify(data));

        setUploadProgress({
          stage: "saving",
          message: "Saving survey data to database...",
          percentage: 70,
        });

        // Preserve the current tab in the URL when submitting
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("tab", activeTab);

        submit(formData, {
          method: "post",
          action: `?${searchParams.toString()}`,
        });

        // The completion will be handled by the useEffect watching actionData
      } catch (error: any) {
        console.error("CSV upload error:", error);
        setUploadResponse(`Upload failed: ${error.message || error}`);
        setUploadProgress(null);
        setUploading(false);
      }

      // Reset file input
      if (event.target) {
        (event.target as HTMLInputElement).value = "";
      }
    },
    [submit, revalidator, activeTab]
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Data Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage employee records and pulse survey data
            </p>
          </div>
          <div className="mb-4">
            <Button
              onClick={() => setShowCreateEmployeeModal(true)}
              className="bg-black hover:bg-gray-700 text-white"
            >
              Create New Employee
            </Button>
            {uploadResponse && (
              <pre className="my-4 p-3 bg-gray-50 border rounded whitespace-pre-wrap">
                {uploadResponse}
              </pre>
            )}
          </div>
        </div>

        {/* Stats Cards - Always show unfiltered stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Employees"
            value={stats.total_employees.toLocaleString()}
            icon={<Users />}
            className="bg-green-50"
          />
          <MetricCard
            title="At-Risk Employees"
            value={stats.attrited_employees.toLocaleString()}
            icon={<Users />}
            className="bg-blue-50"
          />
          <MetricCard
            title="Attrition Rate"
            value={`${stats.attrition_rate}%`}
            icon={<AlertTriangle />}
            className="bg-red-50"
          />
          <MetricCard
            title="High Risk Count"
            value={stats.high_risk_count.toLocaleString()}
            icon={<AlertTriangle />}
            className="bg-orange-50"
          />
        </div>

        {/* Action Messages - Hide when upload dialog is open
        {!showUploadDialog && !uploading && actionData?.success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {actionData.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {!showUploadDialog && !uploading && actionData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {actionData.error}
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="employees">
              Employees ({employeePaginationInfo.totalEmployees})
            </TabsTrigger>
            <TabsTrigger value="surveys">
              Surveys ({surveyPaginationInfo.totalSurveys})
            </TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            {/* Employee Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Employee Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        {
                          [
                            selectedAttritionRisk !== "All Risk Levels" &&
                              "Risk Level",
                          ].filter(Boolean).length
                        }{" "}
                        active
                      </Badge>
                    )}
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attrition Risk Filter */}
                  <div className="space-y-2">
                    <Label>Attrition Risk</Label>
                    <Select
                      value={selectedAttritionRisk}
                      onValueChange={setSelectedAttritionRisk}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRITION_RISKS.map((risk) => (
                          <SelectItem key={risk} value={risk}>
                            {risk}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DataTable
              data={filteredEmployees}
              columns={employeeColumns}
              onDelete={handleEmployeeDelete}
              onBulkDelete={handleEmployeeBulkDelete}
              onCreate={handleEmployeeCreate}
              onBulkUpload={handleEmployeeCsvUpload}
              exportHandler={handleExportEmployees}
              idField="employee_id"
              title="Employee Records"
              searchable={true}
              exportable={true}
              creatable={false}
              editable={true}
              deletable={true}
              bulkActions={true}
              pageSize={10}
              loading={isSubmitting || uploading}
            />
          </TabsContent>

          <TabsContent value="surveys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Survey Filters
                </CardTitle>
                {selectedAttritionRisk !== "All Risk Levels" && (
                  <Badge variant="secondary" className="ml-2">
                    {
                      [
                        selectedAttritionRisk !== "All Risk Levels" &&
                          "Risk Level",
                      ].filter(Boolean).length
                    }{" "}
                    active
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Survey Department Filter */}
                  <div className="space-y-2">
                    <Label>Attrition Risk</Label>
                    <Select
                      value={selectedAttritionRisk}
                      onValueChange={setSelectedAttritionRisk}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRITION_RISKS.map((risk) => (
                          <SelectItem key={risk} value={risk}>
                            {risk}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <DataTable
              data={filteredSurveys}
              columns={surveyColumns}
              onDelete={handleSurveyDelete}
              onBulkDelete={handleSurveyBulkDelete}
              onBulkUpload={handleSurveyCsvUploadViaAction}
              idField="survey_id"
              title="Survey Records"
              editable={false}
              searchable={true}
              exportable={true}
              exportHandler={handleExportSurvey}
              deletable={true}
              bulkActions={true}
              pageSize={10}
              loading={isSubmitting || uploading}
            />
          </TabsContent>
        </Tabs>

        {(showUploadDialog || uploading) && (
          <DialogContent className="sm:max-w-md">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  CSV Upload Progress
                </h3>
                {uploadProgress?.stage === "complete" && (
                  <div className="flex items-center text-green-600">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">Complete</span>
                  </div>
                )}
              </div>

              {uploadProgress && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {uploadProgress.message}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {uploadProgress.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ease-out ${
                          uploadProgress.stage === "complete"
                            ? "bg-green-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${uploadProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stage Indicator */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      {uploadProgress.stage !== "complete" ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      ) : (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        Current Stage:
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {uploadProgress.stage.charAt(0).toUpperCase() +
                        uploadProgress.stage.slice(1)}
                    </span>
                  </div>

                  {/* Stage Steps */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Upload Steps
                    </div>
                    <div className="space-y-1">
                      {[
                        {
                          stage: "parsing",
                          label: "Parsing CSV File",
                          percent: 10,
                        },
                        {
                          stage: "validating",
                          label: "Validating Data",
                          percent: 30,
                        },
                        {
                          stage: "predicting",
                          label: "Generating Predictions",
                          percent: 50,
                        },
                        {
                          stage: "saving",
                          label: "Saving to Database",
                          percent: 80,
                        },
                        {
                          stage: "complete",
                          label: "Upload Complete",
                          percent: 100,
                        },
                      ].map((step) => {
                        const isActive = uploadProgress.stage === step.stage;
                        const isCompleted =
                          uploadProgress.percentage >= step.percent;

                        return (
                          <div
                            key={step.stage}
                            className={`flex items-center space-x-2 p-2 rounded ${
                              isActive
                                ? "bg-blue-50 border border-blue-200"
                                : isCompleted
                                  ? "bg-green-50"
                                  : "bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isActive
                                  ? "bg-blue-600 animate-pulse"
                                  : isCompleted
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                              }`}
                            ></div>
                            <span
                              className={`text-xs ${
                                isActive
                                  ? "text-blue-900 font-medium"
                                  : isCompleted
                                    ? "text-green-700"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {uploadResponse && (
                <div
                  className={`p-4 rounded-lg border ${
                    uploadResponse.includes("failed") ||
                    uploadResponse.includes("error") ||
                    uploadResponse.includes("Error")
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-green-50 text-green-800 border-green-200"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {uploadResponse.includes("failed") ||
                    uploadResponse.includes("error") ||
                    uploadResponse.includes("Error") ? (
                      <svg
                        className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <p className="text-sm font-medium whitespace-pre-wrap">
                      {uploadResponse}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                {uploadProgress?.stage === "complete" ||
                uploadResponse?.includes("failed") ||
                uploadResponse?.includes("error") ||
                uploadResponse?.includes("Error") ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUploadDialog(false);
                        setUploadProgress(null);
                        setUploadResponse(null);
                        setUploading(false);
                      }}
                      className="px-4 py-2"
                    >
                      Close
                    </Button>
                    {uploadProgress?.stage === "complete" && (
                      <Button
                        onClick={() => {
                          window.location.reload();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Refresh Page
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-black">
                Confirmation Dialog
              </DialogTitle>
              <DialogDescription className="pt-4">
                {deleteTarget?.isBulk ? (
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      You are about to delete{" "}
                      <span className="font-bold text-red-600">
                        {deleteTarget.ids?.length}
                      </span>{" "}
                      {deleteTarget.type === "employee"
                        ? "employees"
                        : "surveys"}
                      .
                    </p>
                    {deleteTarget.type === "employee" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Deleting employees will also delete all their
                          associated survey records.
                        </p>
                      </div>
                    )}
                    <p className="text-gray-600 text-sm">
                      This action cannot be undone. Are you sure?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      You are about to delete this{" "}
                      {deleteTarget?.type === "employee"
                        ? "employee"
                        : "survey"}{" "}
                      record.
                    </p>
                    {deleteTarget?.type === "employee" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Deleting this employee will also delete all their
                          associated survey records.
                        </p>
                      </div>
                    )}
                    <p className="text-gray-600 text-sm">
                      This action cannot be undone. Are you sure?
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2 sm:space-x-2">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="flex-1 bg-black hover:bg-gray-700"
              >
                {deleteTarget?.isBulk
                  ? `Delete ${deleteTarget.ids?.length} Records`
                  : "Delete Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <CreateEmployeeModal
        isOpen={showCreateEmployeeModal}
        onClose={() => setShowCreateEmployeeModal(false)}
        onSubmit={handleEmployeeCreate}
        isSubmitting={isCreatingEmployee}
      />
    </Layout>
  );
}
