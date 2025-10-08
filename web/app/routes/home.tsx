import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  Target,
  TrendingDown,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router";
import { Layout } from "~/components/Layout";
import AnimatedGauge from "~/components/Reports/AnimatedGauge";
import BarChart from "~/components/Reports/BarChart";
import PieChart from "~/components/Reports/PieChart";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MetricCard } from "~/components/ui/metric-card";
import { dashboardLoader } from "~/lib/route-loaders";
import { createMeta } from "~/lib/route-utils";
import { calculateHealthScore, getHealthStatus } from "~/lib/utils";
import { chartTransformers } from "~/services/dataTransformers";
import type { Route } from "./+types/home";

// Meta function
export const meta = createMeta({
  title: "Overview - AttriSense",
  description:
    "AttriSense - AI-powered employee attrition prediction and retention analytics. Sense the risk, save your talent.",
  keywords: [
    "HR",
    "attrition",
    "analytics",
    "dashboard",
    "employee retention",
    "AI",
    "predictive analytics",
  ],
});

// Loader function
export const loader = dashboardLoader;

// Main component
export default function Home({ loaderData }: Route.ComponentProps) {
  const { data, error } = loaderData;
  console.log(data);
  const { dashboardData, employeeSegmentation, predictiveInsights } = data;
  console.log(dashboardData, employeeSegmentation, predictiveInsights);

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Safe access with fallbacks
  const employeeStats = dashboardData?.employeeStats;
  const departmentAnalytics = dashboardData?.departmentAnalytics || [];
  const riskDistribution = dashboardData?.riskDistribution || [];
  const pulseSurveyStats = dashboardData?.pulseSurveyStats;
  const workingModelStats = dashboardData?.workingModelStats || [];

  const attritionRate = employeeStats?.attrition_rate || 0;
  const healthScore = calculateHealthScore(attritionRate);
  const healthStatus = getHealthStatus(healthScore);

  const departmentChartData =
    chartTransformers.departmentData(departmentAnalytics);
  const riskChartData = chartTransformers.riskData(riskDistribution);
  const workingModelChartData =
    chartTransformers.workingModelData(workingModelStats);

  // const monthlyTrendsData = chartTransformers.monthlyTrends(
  //   dashboardData.monthlyTrends || []
  // );

  const ageGroupChartData =
    employeeSegmentation?.ageGroups?.map((group: any) => ({
      id: group.age_group,
      label: group.age_group,
      value: parseInt(group.count),
      color:
        group.age_group === "Under 25"
          ? "#3b82f6"
          : group.age_group === "25-34"
            ? "#10b981"
            : group.age_group === "35-44"
              ? "#f59e0b"
              : group.age_group === "45-54"
                ? "#ef4444"
                : "#8b5cf6",
    })) || [];

  const tenureGroupChartData =
    employeeSegmentation?.tenureGroups?.map((group: any) => ({
      id: group.tenure_group,
      label: group.tenure_group,
      value: parseInt(group.count),
      attritionScore: parseFloat(group.avg_attrition_score),
      attritionCount: parseInt(group.attrited_count),
    })) || [];

  const performanceGroupChartData =
    employeeSegmentation?.performanceGroups?.map((group: any) => ({
      id: group.performance_group,
      label: group.performance_group,
      value: parseInt(group.count),
      attritionScore: parseFloat(group.avg_attrition_score),
      attritionCount: parseInt(group.attrited_count),
    })) || [];

  // High-risk employees data for visualization
  const highRiskEmployees = predictiveInsights?.high_risk_employees || [];
  const departmentRisks = predictiveInsights?.department_risks || [];

  // Create department risk heatmap data
  const departmentRiskHeatmapData = departmentRisks.map((dept: any) => ({
    department: dept.department,
    riskScore: parseFloat(dept.risk_score),
    highRiskCount: parseInt(dept.high_risk_count),
    totalEmployees: parseInt(dept.total_employees),
    riskPercentage: (
      (parseInt(dept.high_risk_count) / parseInt(dept.total_employees)) *
      100
    ).toFixed(1),
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              AI-powered employee attrition prediction and retention insights
            </p>
          </div>
          <div className="flex space-x-3">
            <Button asChild variant="outline">
              <Link to="/analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button asChild>
              <Link to="/data-management">
                <Users className="h-4 w-4 mr-2" />
                Manage Data
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Employees"
            value={employeeStats?.total_employees?.toLocaleString() || "0"}
            icon={<Users />}
            className="bg-purple-100"
          />
          <MetricCard
            title="Stable Employees"
            value={employeeStats?.active_employees?.toLocaleString() || "0"}
            icon={<UserCheck />}
            className="bg-green-100"
          />
          <MetricCard
            title="At-Risk Employees"
            value={employeeStats.attrited_employees.toLocaleString() || "0"}
            icon={<Users />}
            className="bg-blue-100"
          />
          <MetricCard
            title="Attrition Rate"
            value={`${Number(attritionRate).toFixed(1)}%`}
            icon={<TrendingDown />}
            className="bg-orange-100"
          />
          <MetricCard
            title="Avg Performance"
            value={Number(employeeStats?.avg_performance)?.toFixed(1) || "0.0"}
            icon={<Target />}
            className="bg-red-100"
          />
        </div>

        {/* Health Score and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Score Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Organization Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AnimatedGauge
                  value={healthScore}
                  max={100}
                  label="Health Index"
                />
                <div className="text-center">
                  <Badge variant={healthStatus.variant}>
                    {healthStatus.label}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Based on current attrition rate of{" "}
                    {Number(attritionRate).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link
                    to="/analytics"
                    className="flex flex-col items-center space-y-2"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm font-medium">View Analytics</span>
                    <span className="text-xs text-gray-500">
                      Detailed insights and trends
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link
                    to="/data-management"
                    className="flex flex-col items-center space-y-2"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      Manage Employees
                    </span>
                    <span className="text-xs text-gray-500">
                      Add, edit, or remove employees
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link
                    to="/reports"
                    className="flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      Generate Reports
                    </span>
                    <span className="text-xs text-gray-500">
                      Export data and insights
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link
                    to="/data-management"
                    className="flex flex-col items-center space-y-2"
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm font-medium">
                      Manage Employees Survey
                    </span>
                    <span className="text-xs text-gray-500">
                      Add, remove employees survey
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Analysis */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Department Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[300px]">
                <BarChart
                  data={departmentChartData}
                  keys={["attritionRate"]}
                  indexBy="department"
                  axisBottomLabel="Department"
                  axisLeftLabel="Attrition Rate (%)"
                  colors={[
                    "#ef4444",
                    "#dc2626",
                    "#b91c1c",
                    "#991b1b",
                    "#7f1d1d",
                  ]}
                  rotateLabels={true}
                  height={300}
                />
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-600">
                  Attrition rate comparison across departments
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {riskChartData.length > 0 ? (
                <>
                  <div className="h-[300px]">
                    <PieChart
                      data={riskChartData}
                      innerRadius={0.6}
                      colors={["#ef4444", "#f59e0b", "#10b981"]}
                      height={300}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {riskChartData.map((item: any) => (
                      <div key={item.id} className="p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600 truncate">
                          {item.label}
                        </div>
                        <div className="text-lg font-semibold">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No risk distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Working Model Distribution */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Working Model Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {workingModelChartData.length > 0 ? (
                <>
                  <div className="h-[300px]">
                    <PieChart
                      data={workingModelChartData}
                      colors={{ scheme: "paired" }}
                      height={300}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {workingModelChartData.map((item: any) => (
                      <div
                        key={item.id}
                        className="text-center p-2 bg-gray-50 rounded"
                      >
                        <div className="text-xs text-gray-600 truncate">
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No working model data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Salary Distribution by Department */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Avg Salary by Department</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {departmentAnalytics.length > 0 ? (
                <>
                  <div className="h-[300px]">
                    <BarChart
                      data={departmentAnalytics.map((dept: any) => ({
                        department: dept.department,
                        avgSalary: parseFloat(dept.avg_salary) / 1000, // Convert to thousands
                      }))}
                      keys={["avgSalary"]}
                      indexBy="department"
                      axisBottomLabel="Department"
                      axisLeftLabel="Avg Salary (K)"
                      colors={[
                        "#8b5cf6",
                        "#7c3aed",
                        "#6d28d9",
                        "#5b21b6",
                        "#4c1d95",
                      ]}
                      rotateLabels={true}
                      height={300}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      Average salary comparison across departments
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No salary data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Size Comparison */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Department Size Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {departmentAnalytics.length > 0 ? (
                <>
                  <div className="h-[300px]">
                    <BarChart
                      data={departmentAnalytics
                        .sort(
                          (a: any, b: any) =>
                            parseInt(b.employee_count) -
                            parseInt(a.employee_count)
                        )
                        .map((dept: any) => ({
                          department: dept.department,
                          count: parseInt(dept.employee_count),
                        }))}
                      keys={["count"]}
                      indexBy="department"
                      axisBottomLabel="Department"
                      axisLeftLabel="Employee Count"
                      colors={[
                        "#3b82f6",
                        "#2563eb",
                        "#1d4ed8",
                        "#1e40af",
                        "#1e3a8a",
                      ]}
                      rotateLabels={true}
                      height={300}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      Total employees per department
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No department data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* High-Risk Employees and Employee Segmentation Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High-Risk Employees Section */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                High-Risk Employees
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                {highRiskEmployees
                  .slice(0, 5)
                  .map((employee: any, index: number) => (
                    <div
                      key={employee.employee_id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {employee.full_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {employee.department} • {employee.job_role}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-xs">
                          {(parseFloat(employee.attrition_score) * 100).toFixed(
                            0
                          )}
                          % Risk
                        </Badge>
                      </div>
                    </div>
                  ))}
                {highRiskEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No high-risk employees identified
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Age Distribution */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {ageGroupChartData.length > 0 ? (
                <>
                  <div className="h-[300px]">
                    <PieChart
                      data={ageGroupChartData}
                      innerRadius={0.6}
                      height={300}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      Employee distribution across age groups
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No age distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tenure and Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tenure Analysis */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Tenure vs Attrition Risk</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {tenureGroupChartData.length > 0 ? (
                <>
                  <div className="h-[350px]">
                    <BarChart
                      data={tenureGroupChartData}
                      keys={["attritionScore"]}
                      indexBy="label"
                      axisBottomLabel="Tenure Group"
                      axisLeftLabel="Avg Risk Score"
                      colors={[
                        "#f59e0b",
                        "#f97316",
                        "#ea580c",
                        "#dc2626",
                        "#b91c1c",
                      ]}
                      rotateLabels={false}
                      height={350}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      Average attrition risk score by tenure
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                  No tenure data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance vs Risk */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Performance vs Attrition</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {performanceGroupChartData.length > 0 ? (
                <>
                  <div className="h-[350px]">
                    <BarChart
                      data={performanceGroupChartData}
                      keys={["attritionCount"]}
                      indexBy="label"
                      axisBottomLabel="Performance Rating"
                      axisLeftLabel="Attrited Count"
                      colors={[
                        "#10b981",
                        "#059669",
                        "#047857",
                        "#065f46",
                        "#064e3b",
                      ]}
                      rotateLabels={false}
                      height={350}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      Number of at-risk employees by performance level
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* High-Risk Employees and Department Risk Analysis */}
        <div className="grid gap-6">
          {/* Department Risk Overview (compact) */}
          <Card>
            <CardHeader>
              <CardTitle>Department Risk Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {departmentRiskHeatmapData.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {departmentRiskHeatmapData
                      .sort((a: any, b: any) => b.riskScore - a.riskScore)
                      .slice(0, 8)
                      .map((dept: any) => (
                        <div
                          key={dept.department}
                          className="p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className="font-medium text-sm truncate pr-2 flex-1"
                              title={dept.department}
                            >
                              {dept.department}
                            </div>
                            <Badge
                              variant={
                                dept.riskScore >= 0.7
                                  ? "destructive"
                                  : dept.riskScore >= 0.5
                                    ? "secondary"
                                    : "default"
                              }
                              className="text-xs flex-shrink-0"
                            >
                              {dept.riskScore >= 0.7
                                ? "Critical"
                                : dept.riskScore >= 0.5
                                  ? "High"
                                  : "Medium"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-600 truncate">
                              {dept.highRiskCount}/{dept.totalEmployees} at risk
                            </div>
                            <div className="text-sm font-semibold text-red-600 flex-shrink-0 ml-2">
                              {dept.riskPercentage}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No department risk data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Key Insights - Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Critical Departments */}
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="font-medium text-sm text-red-900">
                    Critical Risk Departments
                  </div>
                </div>
                <div className="text-xs text-red-700">
                  {Array.isArray(departmentRisks)
                    ? departmentRisks.filter(
                        (d: { risk_score: string }) =>
                          parseFloat(d.risk_score) >= 0.7
                      ).length
                    : 0}{" "}
                  departments require immediate intervention with risk scores ≥
                  70%.
                </div>
              </div>

              {/* High Risk Employees */}
              <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-orange-600" />
                  <div className="font-medium text-sm text-orange-900">
                    High-Risk Employee Count
                  </div>
                </div>
                <div className="text-xs text-orange-700">
                  {Array.isArray(highRiskEmployees)
                    ? highRiskEmployees.length
                    : 0}{" "}
                  employees identified with attrition risk above 70%
                  {employeeStats?.total_employees
                    ? `, representing ${(((Array.isArray(highRiskEmployees) ? highRiskEmployees.length : 0) / parseInt(employeeStats.total_employees || "1")) * 100).toFixed(1)}% of workforce.`
                    : "."}
                </div>
              </div>

              {/* Retention Rate */}
              <div className="p-2.5 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <div className="font-medium text-sm text-green-900">
                    Retention Success
                  </div>
                </div>
                <div className="text-xs text-green-700">
                  {employeeStats?.active_employees &&
                  employeeStats?.total_employees
                    ? `Current retention rate of ${((parseInt(employeeStats.active_employees) / parseInt(employeeStats.total_employees)) * 100).toFixed(1)}% with ${employeeStats.active_employees} stable employees.`
                    : "Retention data not available."}
                </div>
              </div>

              {/* Tenure Impact */}
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div className="font-medium text-sm text-blue-900">
                    Tenure Impact
                  </div>
                </div>
                <div className="text-xs text-blue-700">
                  {tenureGroupChartData?.length > 0
                    ? `Employees with ≤2 years tenure show ${(tenureGroupChartData[0]?.attritionScore * 100).toFixed(0)}% avg attrition risk — focus on onboarding & early retention.`
                    : "Tenure impact data not available."}
                </div>
              </div>

              {/* Performance Correlation */}
              <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-purple-600" />
                  <div className="font-medium text-sm text-purple-900">
                    Performance Correlation
                  </div>
                </div>
                <div className="text-xs text-purple-700">
                  {performanceGroupChartData?.find(
                    (g: any) =>
                      g.label?.includes("Poor") || g.label?.includes("Low")
                  )?.attritionCount || 0}{" "}
                  employees with low performance ratings may leave, indicating
                  opportunities for targeted performance management.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Intervention Recommendations - Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Zap className="h-5 w-5 mr-2 text-green-500" />
              Intervention Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Low Job Satisfaction */}
              <div className="p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-blue-900 mb-0.5">
                      Enhance Job Satisfaction
                    </div>
                    <div className="text-xs text-blue-800 mb-1.5">
                      <strong>Risk Factor:</strong> Low satisfaction correlates
                      with 65% higher attrition risk
                    </div>
                    <div className="text-xs text-blue-700 space-y-0.5">
                      <div>
                        • Conduct quarterly satisfaction surveys and act on
                        feedback
                      </div>
                      <div>• Implement recognition and rewards programs</div>
                      <div>• Create clear career progression pathways</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work-Life Balance */}
              <div className="p-2.5 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-green-900 mb-0.5">
                      Improve Work-Life Balance
                    </div>
                    <div className="text-xs text-green-800 mb-1.5">
                      <strong>Risk Factor:</strong> Poor balance increases
                      attrition by 48%
                    </div>
                    <div className="text-xs text-green-700 space-y-0.5">
                      <div>
                        • Offer flexible working hours and remote work options
                      </div>
                      <div>• Monitor and reduce overtime hours</div>
                      <div>
                        • Promote wellness programs and mental health support
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation & Benefits */}
              <div className="p-2.5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-purple-900 mb-0.5">
                      Competitive Compensation
                    </div>
                    <div className="text-xs text-purple-800 mb-1.5">
                      <strong>Risk Factor:</strong> Below-market salaries drive
                      52% of voluntary exits
                    </div>
                    <div className="text-xs text-purple-700 space-y-0.5">
                      <div>• Conduct annual market salary benchmarking</div>
                      <div>• Implement performance-based bonuses</div>
                      <div>• Review and enhance benefits packages</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Development */}
              <div className="p-2.5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    4
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-orange-900 mb-0.5">
                      Career Growth Opportunities
                    </div>
                    <div className="text-xs text-orange-800 mb-1.5">
                      <strong>Risk Factor:</strong> Limited growth prospects
                      increase risk by 58%
                    </div>
                    <div className="text-xs text-orange-700 space-y-0.5">
                      <div>• Create individual development plans (IDPs)</div>
                      <div>• Provide training and upskilling opportunities</div>
                      <div>• Establish mentorship programs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Management Quality */}
              <div className="p-2.5 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    5
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-red-900 mb-0.5">
                      Strengthen Management
                    </div>
                    <div className="text-xs text-red-800 mb-1.5">
                      <strong>Risk Factor:</strong> Poor manager relationships
                      account for 44% of exits
                    </div>
                    <div className="text-xs text-red-700 space-y-0.5">
                      <div>
                        • Train managers on leadership and communication
                      </div>
                      <div>• Implement 360-degree feedback systems</div>
                      <div>• Conduct regular one-on-one check-ins</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
