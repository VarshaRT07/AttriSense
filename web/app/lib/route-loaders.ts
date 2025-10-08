import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type {
  DataManagementLoaderData,
  EmployeeDetailLoaderData,
  SurveyDetailLoaderData,
} from "./route-types";
import {
  createAction,
  createLoader,
  fetchApi,
  handleFormData,
  validateParams,
} from "./route-utils";

// Dashboard loader
export const dashboardLoader = createLoader(async (): Promise<any> => {
  const [dashboardResponse, segmentationResponse, insightsResponse] =
    await Promise.all([
      fetch("http://localhost:5000/api/analytics/dashboard"),
      fetch("http://localhost:5000/api/analytics/employee-segmentation"),
      fetch("http://localhost:5000/api/analytics/predictive-insights"),
    ]);
  const results = await Promise.all([
    dashboardResponse.ok ? dashboardResponse.json() : null,
    segmentationResponse.ok ? segmentationResponse.json() : null,
    insightsResponse.ok ? insightsResponse.json() : null,
  ]);

  return {
    dashboardData: results[0],
    employeeSegmentation: results[1],
    predictiveInsights: results[2],
  };
}, "Dashboard loader");

// Employee detail loader
export const employeeDetailLoader = createLoader(
  async ({
    params,
  }: LoaderFunctionArgs): Promise<EmployeeDetailLoaderData["data"]> => {
    const validatedParams = validateParams(params, ["employeeId"]);
    const { employeeId } = validatedParams;

    const [employee, surveys] = await Promise.all([
      fetchApi(`/employees/${employeeId}`),
      fetchApi(`/pulse-surveys/employee/${employeeId}`),
    ]);

    return { employee: employee as any, surveys: surveys as any };
  },
  "Employee detail loader"
);

// Survey detail loader
export const surveyDetailLoader = createLoader(
  async ({
    params,
  }: LoaderFunctionArgs): Promise<SurveyDetailLoaderData["data"]> => {
    const validatedParams = validateParams(params, ["employeeId"]);
    const { employeeId } = validatedParams;

    const [survey, employee] = await Promise.all([
      fetchApi(`/pulse-surveys/employee/${employeeId}`),
      fetchApi(`/employees/${employeeId}`),
    ]);

    return { survey: survey as any, employee: employee as any };
  },
  "Survey detail loader"
);

// Data management loader - Pure data fetching without filtering
export const dataManagementLoader = createLoader(
  async (): Promise<DataManagementLoaderData["data"]> => {
    try {
      // Fetch all data without any filters for pure client-side filtering
      const [employeesResponse, surveysResponse, statsResponse] =
        await Promise.all([
          fetch("http://localhost:5000/api/employees?limit=1000"), // Get all employees
          fetch("http://localhost:5000/api/pulse-surveys?limit=1000"), // Get all surveys
          fetch("http://localhost:5000/api/employees/stats"), // Always unfiltered
        ]);

      if (!employeesResponse.ok) {
        throw new Error(
          `Failed to fetch employees: ${employeesResponse.status}`
        );
      }
      if (!surveysResponse.ok) {
        throw new Error(`Failed to fetch surveys: ${surveysResponse.status}`);
      }
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
      }

      const [employeesData, surveysData, stats] = await Promise.all([
        employeesResponse.json(),
        surveysResponse.json(),
        statsResponse.json(),
      ]);

      return {
        employees: employeesData.employees || [],
        employeePagination: {
          currentPage: 1,
          totalPages: 1,
          totalEmployees: (employeesData.employees || []).length,
          limit: 1000,
        },
        surveys: surveysData.surveys || [],
        surveyPagination: {
          currentPage: 1,
          totalPages: 1,
          totalSurveys: (surveysData.surveys || []).length,
          limit: 1000,
        },
        stats, // Always shows unfiltered stats
        filters: {
          employee: {
            search: undefined,
            department: undefined,
            working_model: undefined,
            attrition_risk: undefined,
            sort_by: "employee_id",
            sort_order: "asc",
          },
          survey: {
            search: undefined,
            department: undefined,
            sort_by: "survey_id",
            sort_order: "desc",
          },
        },
      };
    } catch (error) {
      console.error("Data management loader error:", error);
      return {
        employees: [],
        employeePagination: {
          currentPage: 1,
          totalPages: 1,
          totalEmployees: 0,
          limit: 10,
        },
        surveys: [],
        surveyPagination: {
          currentPage: 1,
          totalPages: 1,
          totalSurveys: 0,
          limit: 10,
        },
        stats: {
          total_employees: 0,
          active_employees: 0,
          attrited_employees: 0,
          attrition_rate: 0,
          avg_salary: 0,
          avg_age: 0,
          avg_tenure: 0,
          avg_performance: 0,
          high_risk_count: 0,
          medium_risk_count: 0,
          low_risk_count: 0,
        },
        filters: {
          employee: {
            search: undefined,
            department: undefined,
            working_model: undefined,
            attrition_risk: undefined,
            sort_by: "employee_id",
            sort_order: "asc",
          },
          survey: {
            search: undefined,
            department: undefined,
            sort_by: "survey_id",
            sort_order: "desc",
          },
        },
      };
    }
  },
  "dataManagementLoader"
);

// Analytics loader
export const analyticsLoader = createLoader(async () => {
  const [
    dashboard,
    departmentComparison,
    employeeSegmentation,
    predictiveInsights,
  ] = await Promise.all([
    fetchApi("/analytics/dashboard"),
    fetchApi("/analytics/department-comparison"),
    fetchApi("/analytics/employee-segmentation"),
    fetchApi("/analytics/predictive-insights"),
  ]);

  return {
    dashboard,
    departmentComparison,
    employeeSegmentation,
    predictiveInsights,
  };
}, "Analytics loader");

// CRUD action for data management
export const crudAction = createAction(
  async ({ request }: ActionFunctionArgs) => {
    const formData = await handleFormData(request, ["action", "type"]);
    const { action, type, ...data } = formData;

    console.log(
      "Action received:",
      action,
      "Type:",
      type,
      "Data keys:",
      Object.keys(data)
    );

    switch (action) {
      case "create":
        if (type === "employee") {
          // Extract employeeData if it exists, otherwise use data directly
          const employeePayload = data.employeeData
            ? typeof data.employeeData === "string"
              ? JSON.parse(data.employeeData)
              : data.employeeData
            : data;

          console.log(
            "CRUD action: Creating employee with payload:",
            employeePayload
          );

          return await fetchApi("/employees", {
            method: "POST",
            body: JSON.stringify(employeePayload),
          });
        } else if (type === "survey") {
          return await fetchApi("/pulse-surveys", {
            method: "POST",
            body: JSON.stringify(data),
          });
        }
        break;

      case "update":
        if (type === "employee" && data.employee_id) {
          return await fetchApi(`/employees/${data.employee_id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
        } else if (type === "survey" && data.survey_id) {
          return await fetchApi(`/pulse-surveys/${data.survey_id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
        }
        break;

      case "delete":
        if (type === "employee" && data.id) {
          return await fetchApi(`/employees/${data.id}`, {
            method: "DELETE",
          });
        } else if (type === "survey" && data.id) {
          return await fetchApi(`/pulse-surveys/${data.id}`, {
            method: "DELETE",
          });
        }
        break;

      case "bulkDelete":
        const ids = Array.isArray(data.ids)
          ? data.ids
          : JSON.parse(data.ids as string);
        if (type === "employee") {
          return await Promise.all(
            ids.map((id: string | number) =>
              fetchApi(`/employees/${id}`, { method: "DELETE" })
            )
          );
        } else if (type === "survey") {
          return await Promise.all(
            ids.map((id: string | number) =>
              fetchApi(`/pulse-surveys/${id}`, { method: "DELETE" })
            )
          );
        }
        break;

      case "csvUpload":
        console.log("Processing CSV upload for type:", type);
        if (type === "employee") {
          try {
            if (!data.csvData) {
              throw new Error("No CSV data provided");
            }

            const csvData =
              typeof data.csvData === "string"
                ? JSON.parse(data.csvData)
                : data.csvData;
            console.log(
              "CSV data parsed, records count:",
              Array.isArray(csvData) ? csvData.length : "unknown"
            );

            // Validation: Check if CSV data is an array
            if (!Array.isArray(csvData) || csvData.length === 0) {
              throw new Error("CSV file is empty or invalid format");
            }

            // Validation: Check required columns
            const requiredColumns = [
              "Employee ID",
              "Full Name",
              "Age",
              "Gender",
              "Years of experience",
              "Job Role",
              "Salary",
              "Performance Rating",
              "Number of Promotions",
              "Overtime",
              "Commuting distance",
              "Education Level",
              "Marital Status",
              "Number of Dependents",
              "Job Level",
              "Last hike",
              "Years in current role",
              "Working model",
              "Working hours",
              "Department",
              "No. of companies worked previously",
              "LeavesTaken",
              "YearsWithCompany",
            ];

            const csvColumns = Object.keys(csvData[0] || {});
            const missingColumns = requiredColumns.filter(
              (col) => !csvColumns.includes(col)
            );

            if (missingColumns.length > 0) {
              throw new Error(
                `Missing required columns: ${missingColumns.join(", ")}. Please ensure your CSV has all required columns.`
              );
            }

            // Validation: Check for duplicate Employee IDs within the CSV
            const employeeIds = csvData
              .map((row: any) => row["Employee ID"])
              .filter((id: any) => id != null);
            const duplicateIds = employeeIds.filter(
              (id: any, index: number) => employeeIds.indexOf(id) !== index
            );

            if (duplicateIds.length > 0) {
              throw new Error(
                `Duplicate Employee IDs found in CSV: ${[...new Set(duplicateIds)].join(", ")}`
              );
            }

            // Validation: Check for existing Employee IDs in database
            try {
              const existingEmployees = (await fetchApi("/employees")) as any[];
              const existingIds = existingEmployees.map(
                (emp: any) => emp.employee_id
              );
              const conflictingIds = employeeIds.filter((id: any) =>
                existingIds.includes(Number(id))
              );

              if (conflictingIds.length > 0) {
                throw new Error(
                  `Employee IDs already exist in database: ${conflictingIds.join(", ")}. Please remove these records or update their IDs.`
                );
              }
            } catch (fetchError: any) {
              console.warn(
                "Could not validate existing employee IDs:",
                fetchError.message
              );
              // Continue with upload if we can't check existing IDs
            }

            // Validation: Check data types and ranges
            const validationErrors: string[] = [];

            csvData.forEach((row: any, index: number) => {
              const rowNum = index + 1;

              // Validate Employee ID
              const empId = row["Employee ID"];
              if (!empId || isNaN(Number(empId))) {
                validationErrors.push(
                  `Row ${rowNum}: Employee ID must be a valid number`
                );
              }

              // Validate Full Name
              if (
                !row["Full Name"] ||
                typeof row["Full Name"] !== "string" ||
                row["Full Name"].trim() === ""
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Full Name is required and must be a non-empty string`
                );
              }

              // Validate Age
              const age = Number(row["Age"]);
              if (row["Age"] && (isNaN(age) || age < 18 || age > 100)) {
                validationErrors.push(
                  `Row ${rowNum}: Age must be between 18 and 100`
                );
              }

              // Validate Gender
              if (row["Gender"] && !["M", "F", "O"].includes(row["Gender"])) {
                validationErrors.push(
                  `Row ${rowNum}: Gender must be either 'M' or 'F' or 'O'`
                );
              }

              // Validate Performance Rating
              const perfRating = Number(row["Performance Rating"]);
              if (
                row["Performance Rating"] &&
                (isNaN(perfRating) || perfRating < 1 || perfRating > 5)
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Performance Rating must be between 1 and 5`
                );
              }

              // Validate Salary
              const salary = Number(row["Salary"]);
              if (row["Salary"] && (isNaN(salary) || salary < 0)) {
                validationErrors.push(
                  `Row ${rowNum}: Salary must be a positive number`
                );
              }

              // Validate Working Model
              if (
                row["Working model"] &&
                !["Remote", "Hybrid", "Onsite"].includes(row["Working model"])
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Working model must be 'Remote', 'Hybrid', or 'Onsite'`
                );
              }

              // Validate Marital Status
              if (
                row["Marital Status"] &&
                !["Single", "Married", "Divorced", "Widowed"].includes(
                  row["Marital Status"]
                )
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Marital Status must be 'Single', 'Married', or 'Divorced' ,or 'Widowed'`
                );
              }

              // Validate Overtime
              if (
                row["Overtime"] &&
                !["Yes", "No", "1", "0", 1, 0, true, false].includes(
                  row["Overtime"]
                )
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Overtime must be 'Yes', 'No', 1, or 0`
                );
              }

              // Validate Education Level
              const eduLevel = Number(row["Education Level"]);
              if (
                row["Education Level"] &&
                ![
                  "Graduate",
                  "Post-Graduate",
                  "Diploma",
                  "School",
                  "Doctorate",
                ].includes(row["Education Level"])
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Education Level must be 'Graduate', 'Post-Graduate', 'Diploma', 'School', 'Doctorate'`
                );
              }

              // Validate Job Level
              const jobLevel = Number(row["Job Level"]);
              if (
                row["Job Level"] &&
                (isNaN(jobLevel) || jobLevel < 1 || jobLevel > 10)
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Job Level must be between 1 and 10`
                );
              }
            });

            if (validationErrors.length > 0) {
              const errorMessage =
                validationErrors.length > 10
                  ? `Validation errors found:\n${validationErrors.slice(0, 10).join("\n")}\n... and ${validationErrors.length - 10} more errors`
                  : `Validation errors found:\n${validationErrors.join("\n")}`;
              throw new Error(errorMessage);
            }

            // Helper function for safe number parsing
            const parseNumber = (val: any) =>
              val === undefined || val === null || val === ""
                ? null
                : Number(val);

            const convertOvertime = (val: any) => {
              if (val === "Yes" || val === "1" || val === 1 || val === true)
                return 1;
              if (val === "No" || val === "0" || val === 0 || val === false)
                return 0;
              return null;
            };

            // Remove attrition fields if present
            const cleanedData = Array.isArray(csvData)
              ? csvData.map(
                  ({ attrition_score, attrition, ...rest }: any) => rest
                )
              : [];
            console.log("Data cleaned, calling ML prediction API...");

            // Get predictions from ML model
            const predictionResponse = await fetch(
              "http://localhost:8000/predict_batch",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedData),
              }
            );

            if (!predictionResponse.ok) {
              const errorText = await predictionResponse.text();
              console.error("Prediction API error:", errorText);
              throw new Error(`Prediction failed: ${errorText}`);
            }

            const predictions = await predictionResponse.json();
            console.log(
              "Predictions received, count:",
              Array.isArray(predictions) ? predictions.length : "unknown"
            );

            // Create a map from prediction data for easy merge
            const predictionMap = new Map<string | number, any>();
            Array.isArray(predictions) &&
              predictions.forEach((item: any) => {
                const key =
                  item["Employee ID"] ??
                  item.employee_id ??
                  item["Full Name"] ??
                  item.full_name;
                if (key) predictionMap.set(key, item);
              });

            // Enrich data with predictions
            const enrichedData = Array.isArray(csvData)
              ? csvData.map((record: any) => {
                  const key =
                    record["Employee ID"] ??
                    record.employee_id ??
                    record["Full Name"] ??
                    record.full_name;

                  const prediction = key ? predictionMap.get(key) : null;

                  return {
                    employee_id: parseNumber(record["Employee ID"]),
                    full_name: record["Full Name"] ?? null,
                    age: parseNumber(record["Age"]),
                    gender: record["Gender"] ?? null,
                    years_of_experience: parseNumber(
                      record["Years of experience"]
                    ),
                    job_role: record["Job Role"] ?? null,
                    salary: parseNumber(record["Salary"]),
                    performance_rating: parseNumber(
                      record["Performance Rating"]
                    ),
                    number_of_promotions: parseNumber(
                      record["Number of Promotions"]
                    ),
                    overtime: convertOvertime(record["Overtime"]),
                    commuting_distance: parseNumber(
                      record["Commuting distance"]
                    ),
                    education_level: record["Education Level"] ?? null,
                    marital_status: record["Marital Status"] ?? null,
                    number_of_dependents: parseNumber(
                      record["Number of Dependents"]
                    ),
                    job_level: parseNumber(record["Job Level"]),
                    last_hike: parseNumber(record["Last hike"]),
                    years_in_current_role: parseNumber(
                      record["Years in current role"]
                    ),
                    working_model: record["Working model"] ?? null,
                    working_hours: parseNumber(record["Working hours"]),
                    department: record["Department"] ?? null,
                    no_of_companies_worked_previously: parseNumber(
                      record["No. of companies worked previously"]
                    ),
                    leaves_taken: parseNumber(record["LeavesTaken"]),
                    years_with_company: parseNumber(record["YearsWithCompany"]),
                    attrition_score: prediction?.attrition_probability ?? null,
                    attrition:
                      prediction?.attrition ??
                      (prediction?.attrition_probability != null
                        ? prediction.attrition_probability > 0.5
                          ? 1
                          : 0
                        : null),
                    top_positive_contributors:
                      prediction?.top_positive_contributors ?? [],
                    top_negative_contributors:
                      prediction?.top_negative_contributors ?? [],
                  };
                })
              : [];

            console.log("Data enriched, saving to database...");

            // Save to database
            const dbResponse = await fetchApi("/employees/bulk", {
              method: "POST",
              body: JSON.stringify(enrichedData),
            });

            console.log("Database save response:", dbResponse);

            return {
              success: true,
              message: `Successfully uploaded ${enrichedData.length} employee records with predictions`,
              type: "upload",
            };
          } catch (error: any) {
            console.error("CSV upload error:", error);
            return {
              success: false,
              error: `CSV upload failed: ${error.message || error}`,
              type: "upload",
            };
          }
        } else if (type === "survey") {
          try {
            if (!data.csvData) {
              throw new Error("No CSV data provided");
            }

            const csvData =
              typeof data.csvData === "string"
                ? JSON.parse(data.csvData)
                : data.csvData;
            console.log(
              "Survey CSV data parsed, records count:",
              Array.isArray(csvData) ? csvData.length : "unknown"
            );

            // Validation: Check if CSV data is an array
            if (!Array.isArray(csvData) || csvData.length === 0) {
              throw new Error("CSV file is empty or invalid format");
            }

            // Validation: Check required columns for surveys
            const requiredColumns = [
              "Employee ID",
              "Full Name",
              "Work-Life Balance",
              "Job Satisfaction",
              "Relationship with Manager",
              "Communication effectiveness",
              "Recognition and Reward Satisfaction",
              "Career growth and advancement opportunities",
              "Alignment with Company Values/Mission",
              "Perceived fairness",
              "Team cohesion and peer support",
              "Autonomy at work",
              "Overall engagement",
              "Training and skill development satisfaction",
              "Stress levels/work pressure",
              "Organizational change readiness",
              "Feedback frequency and usefulness",
              "Flexibility support",
              "Conflict at work",
              "Perceived job security",
              "Environment satisfaction",
            ];

            const csvColumns = Object.keys(csvData[0] || {});
            const missingColumns = requiredColumns.filter(
              (col) => !csvColumns.includes(col)
            );

            if (missingColumns.length > 0) {
              throw new Error(
                `Missing required columns: ${missingColumns.join(", ")}. Please ensure your CSV has all required survey columns.`
              );
            }

            // Validation: Check for duplicate Employee IDs within the CSV
            const employeeIds = csvData
              .map((row: any) => row["Employee ID"])
              .filter((id: any) => id != null);
            const duplicateIds = employeeIds.filter(
              (id: any, index: number) => employeeIds.indexOf(id) !== index
            );

            if (duplicateIds.length > 0) {
              throw new Error(
                `Duplicate Employee IDs found in CSV: ${[...new Set(duplicateIds)].join(", ")}`
              );
            }

            // Validation: Check if Employee IDs exist in database
            try {
              const existingEmployees = (await fetchApi("/employees")) as any[];
              const existingIds = existingEmployees.map(
                (emp: any) => emp.employee_id
              );
              const missingEmployeeIds = employeeIds.filter(
                (id: any) => !existingIds.includes(Number(id))
              );

              if (missingEmployeeIds.length > 0) {
                throw new Error(
                  `Employee IDs not found in database: ${missingEmployeeIds.join(", ")}. Please ensure all employees exist before uploading surveys.`
                );
              }
            } catch (fetchError: any) {
              if (fetchError.message.includes("not found in database")) {
                throw fetchError;
              }
              console.warn(
                "Could not validate existing employee IDs:",
                fetchError.message
              );
              // Continue with upload if we can't check existing IDs
            }

            // Validation: Check data types and ranges for survey fields
            const validationErrors: string[] = [];

            csvData.forEach((row: any, index: number) => {
              const rowNum = index + 1;

              // Validate Employee ID
              const empId = row["Employee ID"];
              if (!empId || isNaN(Number(empId))) {
                validationErrors.push(
                  `Row ${rowNum}: Employee ID must be a valid number`
                );
              }

              // Validate Full Name
              if (
                !row["Full Name"] ||
                typeof row["Full Name"] !== "string" ||
                row["Full Name"].trim() === ""
              ) {
                validationErrors.push(
                  `Row ${rowNum}: Full Name is required and must be a non-empty string`
                );
              }

              // Validate all survey rating fields (1-5 scale)
              const ratingFields = [
                "Work-Life Balance",
                "Job Satisfaction",
                "Relationship with Manager",
                "Communication effectiveness",
                "Recognition and Reward Satisfaction",
                "Career growth and advancement opportunities",
                "Alignment with Company Values/Mission",
                "Perceived fairness",
                "Team cohesion and peer support",
                "Autonomy at work",
                "Overall engagement",
                "Training and skill development satisfaction",
                "Stress levels/work pressure",
                "Organizational change readiness",
                "Feedback frequency and usefulness",
                "Flexibility support",
                "Conflict at work",
                "Perceived job security",
                "Environment satisfaction",
              ];

              ratingFields.forEach((field) => {
                const value = row[field];
                if (value !== undefined && value !== null && value !== "") {
                  const numValue = Number(value);
                  if (isNaN(numValue) || numValue < 1 || numValue > 5) {
                    validationErrors.push(
                      `Row ${rowNum}: ${field} must be between 1 and 5`
                    );
                  }
                }
              });
            });

            if (validationErrors.length > 0) {
              const errorMessage =
                validationErrors.length > 10
                  ? `Validation errors found:\n${validationErrors.slice(0, 10).join("\n")}\n... and ${validationErrors.length - 10} more errors`
                  : `Validation errors found:\n${validationErrors.join("\n")}`;
              throw new Error(errorMessage);
            }

            // Helper function for safe number parsing
            const parseNumber = (val: any) =>
              val === undefined || val === null || val === ""
                ? null
                : Number(val);

            // Remove attrition fields if present
            const cleanedData = Array.isArray(csvData)
              ? csvData.map(
                  ({
                    attrition_probability,
                    attrition,
                    top_positive_contributors,
                    top_negative_contributors,
                    ...rest
                  }: any) => rest
                )
              : [];
            console.log("Survey data cleaned, calling ML prediction API...");

            // Get predictions from ML model
            const predictionResponse = await fetch(
              "http://localhost:8000/survey_predict_batch",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedData),
              }
            );

            if (!predictionResponse.ok) {
              const errorText = await predictionResponse.text();
              console.error("Survey prediction API error:", errorText);
              throw new Error(`Survey prediction failed: ${errorText}`);
            }

            const predictions = await predictionResponse.json();
            console.log(
              "Survey predictions received, count:",
              Array.isArray(predictions) ? predictions.length : "unknown"
            );

            // Create a map from prediction data for easy merge
            const predictionMap = new Map<string | number, any>();
            Array.isArray(predictions) &&
              predictions.forEach((item: any) => {
                const key =
                  item["Employee ID"] ??
                  item.employee_id ??
                  item["Full Name"] ??
                  item.full_name;
                if (key) predictionMap.set(key, item);
              });

            // Enrich data with predictions
            const enrichedData = Array.isArray(csvData)
              ? csvData.map((record: any) => {
                  const key =
                    record["Employee ID"] ??
                    record.employee_id ??
                    record["Full Name"] ??
                    record.full_name;

                  const prediction = key ? predictionMap.get(key) : null;

                  return {
                    "Employee ID": parseNumber(record["Employee ID"]),
                    "Full Name": record["Full Name"] ?? null,
                    "Work-Life Balance": parseNumber(
                      record["Work-Life Balance"]
                    ),
                    "Job Satisfaction": parseNumber(record["Job Satisfaction"]),
                    "Relationship with Manager": parseNumber(
                      record["Relationship with Manager"]
                    ),
                    "Communication effectiveness": parseNumber(
                      record["Communication effectiveness"]
                    ),
                    "Recognition and Reward Satisfaction": parseNumber(
                      record["Recognition and Reward Satisfaction"]
                    ),
                    "Career growth and advancement opportunities": parseNumber(
                      record["Career growth and advancement opportunities"]
                    ),
                    "Alignment with Company Values/Mission": parseNumber(
                      record["Alignment with Company Values/Mission"]
                    ),
                    "Perceived fairness": parseNumber(
                      record["Perceived fairness"]
                    ),
                    "Team cohesion and peer support": parseNumber(
                      record["Team cohesion and peer support"]
                    ),
                    "Autonomy at work": parseNumber(record["Autonomy at work"]),
                    "Overall engagement": parseNumber(
                      record["Overall engagement"]
                    ),
                    "Training and skill development satisfaction": parseNumber(
                      record["Training and skill development satisfaction"]
                    ),
                    "Stress levels/work pressure": parseNumber(
                      record["Stress levels/work pressure"]
                    ),
                    "Organizational change readiness": parseNumber(
                      record["Organizational change readiness"]
                    ),
                    "Feedback frequency and usefulness": parseNumber(
                      record["Feedback frequency and usefulness"]
                    ),
                    "Flexibility support": parseNumber(
                      record["Flexibility support"]
                    ),
                    "Conflict at work": parseNumber(record["Conflict at work"]),
                    "Perceived job security": parseNumber(
                      record["Perceived job security"]
                    ),
                    "Environment satisfaction": parseNumber(
                      record["Environment satisfaction"]
                    ),
                    attrition_probability:
                      prediction?.attrition_probability ?? null,
                    attrition:
                      prediction?.attrition ??
                      (prediction?.attrition_probability != null
                        ? prediction.attrition_probability > 0.5
                          ? 1
                          : 0
                        : null),
                    top_positive_contributors:
                      prediction?.top_positive_contributors ?? [],
                    top_negative_contributors:
                      prediction?.top_negative_contributors ?? [],
                  };
                })
              : [];

            console.log("Survey data enriched, saving to database...");

            // Save to database
            const dbResponse = await fetchApi("/pulse-surveys/bulk", {
              method: "POST",
              body: JSON.stringify(enrichedData),
            });

            console.log("Survey database save response:", dbResponse);

            return {
              success: true,
              message: `Successfully uploaded ${enrichedData.length} survey records with predictions`,
              type: "upload",
            };
          } catch (error: any) {
            console.error("Survey CSV upload error:", error);
            return {
              success: false,
              error: `Survey CSV upload failed: ${error.message || error}`,
              type: "upload",
            };
          }
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    throw new Error("Invalid action parameters");
  },
  "CRUD action"
);
