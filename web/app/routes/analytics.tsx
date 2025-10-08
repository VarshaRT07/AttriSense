import { AlertTriangle, Download, BarChart3, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ShapPlots } from "~/components/analytics";
import type {
  AttritionTrend,
  DashboardData,
  DepartmentComparison,
  EmployeeSegmentation,
  PredictiveInsights,
} from "~/lib/interface";
import { Layout } from "../components/Layout";
import type { Route } from "./+types/analytics";

interface LoaderData {
  dashboardData: DashboardData | null;
  attritionTrends: AttritionTrend[] | null;
  departmentComparison: DepartmentComparison[] | null;
  employeeSegmentation: EmployeeSegmentation | null;
  predictiveInsights: PredictiveInsights | null;
  error?: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Analytics - AttriSense" },
    { name: "description", content: "Sense the risk, save your talent. AI-powered employee attrition prediction and retention analytics." },
  ];
}

export async function loader({
  request,
}: Route.LoaderArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "6months";

  try {
    // Fetch all analytics data in parallel
    const [
      dashboardResponse,
      trendsResponse,
      comparisonResponse,
      segmentationResponse,
      insightsResponse,
    ] = await Promise.all([
      fetch("http://localhost:5000/api/analytics/dashboard"),
      fetch(
        `http://localhost:5000/api/analytics/attrition-trends?period=${period}`
      ),
      fetch("http://localhost:5000/api/analytics/department-comparison"),
      fetch("http://localhost:5000/api/analytics/employee-segmentation"),
      fetch("http://localhost:5000/api/analytics/predictive-insights"),
    ]);

    const results = await Promise.all([
      dashboardResponse.ok ? dashboardResponse.json() : null,
      trendsResponse.ok ? trendsResponse.json() : null,
      comparisonResponse.ok ? comparisonResponse.json() : null,
      segmentationResponse.ok ? segmentationResponse.json() : null,
      insightsResponse.ok ? insightsResponse.json() : null,
    ]);

    return {
      dashboardData: results[0],
      attritionTrends: results[1],
      departmentComparison: results[2],
      employeeSegmentation: results[3],
      predictiveInsights: results[4],
    };
  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    return {
      dashboardData: null,
      attritionTrends: null,
      departmentComparison: null,
      employeeSegmentation: null,
      predictiveInsights: null,
      error: "Failed to load analytics data",
    };
  }
}

export default function Analytics({ loaderData }: Route.ComponentProps) {
  const {
    dashboardData,
    error,
  } = loaderData as LoaderData;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<any>(null);
  const [selectedSurveyData, setSelectedSurveyData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<"employee" | "survey">("employee");
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);

  // Load employee data when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && selectedEmployeeId.trim() !== "") {
      setLoadingEmployee(true);
      fetch(`http://localhost:5000/api/employees/${selectedEmployeeId}`)
        .then(res => res.json())
        .then(employee => {
          // Transform employee data to ML API format
          const mlData = {
            "Employee ID": employee.employee_id,
            "Full Name": employee.full_name,
            "Age": employee.age,
            "Gender": employee.gender,
            "Years of experience": employee.years_of_experience,
            "Job Role": employee.job_role,
            "Salary": employee.salary,
            "Performance Rating": employee.performance_rating,
            "Number of Promotions": employee.number_of_promotions,
            "Overtime": employee.overtime ? "Yes" : "No",
            "Commuting distance": employee.commuting_distance,
            "Education Level": employee.education_level,
            "Marital Status": employee.marital_status,
            "Number of Dependents": employee.number_of_dependents,
            "Job Level": employee.job_level,
            "Last hike": employee.last_hike,
            "Years in current role": employee.years_in_current_role,
            "Working model": employee.working_model,
            "Working hours": employee.working_hours,
            "Department": employee.department,
            "No. of companies worked previously": employee.no_of_companies_worked_previously,
            "LeavesTaken": employee.leaves_taken,
            "YearsWithCompany": employee.years_with_company,
          };
          setSelectedEmployeeData(mlData);
          setLoadingEmployee(false);
        })
        .catch(err => {
          console.error("Error loading employee:", err);
          setSelectedEmployeeData(null);
          setLoadingEmployee(false);
        });
    } else {
      setSelectedEmployeeData(null);
      setLoadingEmployee(false);
    }
  }, [selectedEmployeeId]);

  // Load survey data when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && selectedEmployeeId.trim() !== "") {
      setLoadingSurvey(true);
      fetch(`http://localhost:5000/api/pulse-surveys/employee/${selectedEmployeeId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log("Survey data received:", data);

          // Backend returns an array, get the first survey
          const survey = Array.isArray(data) ? data[0] : data;

          // Check if survey data exists
          if (!survey || !survey.employee_id) {
            console.warn("No survey data found for employee:", selectedEmployeeId);
            setSelectedSurveyData(null);
            setLoadingSurvey(false);
            return;
          }

          // Transform survey data to ML API format with correct feature names
          const mlSurveyData = {
            "Employee ID": parseInt(selectedEmployeeId) || survey.employee_id,
            "Full Name": survey.full_name || "Unknown",
            "Work-Life Balance": survey.work_life_balance,
            "Job Satisfaction": survey.job_satisfaction,
            "Relationship with Manager": survey.relationship_with_manager,
            "Communication effectiveness": survey.communication_effectiveness,
            "Recognition and Reward Satisfaction": survey.recognition_reward_sat,
            "Career growth and advancement opportunities": survey.career_growth_opportunities,
            "Alignment with Company Values/Mission": survey.alignment_with_company_values,
            "Perceived fairness": survey.perceived_fairness,
            "Team cohesion and peer support": survey.team_cohesion_support,
            "Autonomy at work": survey.autonomy_at_work,
            "Overall engagement": survey.overall_engagement,
            "Training and skill development satisfaction": survey.training_skill_dev_sat,
            "Stress levels/work pressure": survey.stress_levels,
            "Organizational change readiness": survey.org_change_readiness,
            "Feedback frequency and usefulness": survey.feedback_usefulness,
            "Flexibility support": survey.flexibility_support,
            "Conflict at work": survey.conflict_at_work,
            "Perceived job security": survey.perceived_job_security,
            "Environment satisfaction": survey.environment_satisfaction,
          };

          console.log("Transformed survey data for ML API:", mlSurveyData);
          setSelectedSurveyData(mlSurveyData);
          setLoadingSurvey(false);
        })
        .catch(err => {
          console.error("Error loading survey:", err);
          setSelectedSurveyData(null);
          setLoadingSurvey(false);
        });
    } else {
      setSelectedSurveyData(null);
      setLoadingSurvey(false);
    }
  }, [selectedEmployeeId]);

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              AI-powered attrition intelligence - Sense the risk, save your talent
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
        {/* Individual Employee Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Employee Analysis (Optional)</CardTitle>
            <CardDescription>
              Enter an employee ID to view personalized force plot and waterfall analysis.
              General analytics are available below without entering an ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="Enter employee ID to analyze attrition risk..."
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEmployeeId("");
                    setSelectedEmployeeData(null);
                    setSelectedSurveyData(null);
                  }}
                  disabled={!selectedEmployeeId}
                >
                  Clear Selection
                </Button>
              </div>

              {/* Loading States */}
              {selectedEmployeeId && (loadingEmployee || loadingSurvey) && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  Fetching employee and survey data...
                </div>
              )}

              {/* Data Status */}
              {selectedEmployeeData && !loadingEmployee && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  ✓ Employee profile loaded successfully
                </div>
              )}
              {selectedSurveyData && !loadingSurvey && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  ✓ Pulse survey responses loaded
                </div>
              )}
              {selectedEmployeeId && !selectedSurveyData && !loadingSurvey && (
                <div className="text-sm text-amber-600">
                  ⚠ No pulse survey responses available for this employee
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SHAP Plots with Analysis Type Tabs - Always visible */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Factor Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as "employee" | "survey")}>
              <TabsList className="mb-6">
                <TabsTrigger value="employee">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Demographics & Job Analysis
                </TabsTrigger>
                <TabsTrigger value="survey">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Pulse Survey Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employee">
                <ShapPlots
                  employeeId={selectedEmployeeId}
                  employeeData={selectedEmployeeData}
                  dataType="employee"
                />
              </TabsContent>

              <TabsContent value="survey">
                <ShapPlots
                  employeeId={selectedEmployeeId}
                  employeeData={selectedSurveyData}
                  dataType="survey"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
