import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Download,
  FileBarChart,
  FileText,
  IndianRupee,
  Loader2,
  Target,
  TrendingUp,
  Users,
  UserX,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  LineChart,
} from "lucide-react";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Layout } from "../components/Layout";

export function meta() {
  return [
    { title: "Reports - AttriSense" },
    {
      name: "description",
      content: "Comprehensive attrition reports and AI-powered insights",
    },
  ];
}

// Loader to fetch dynamic data
export async function loader() {
  try {
    const [dashboardRes, departmentRes, predictiveRes, trendsRes] =
      await Promise.all([
        fetch("http://localhost:5000/api/analytics/dashboard"),
        fetch("http://localhost:5000/api/analytics/department-comparison"),
        fetch("http://localhost:5000/api/analytics/predictive-insights"),
        fetch("http://localhost:5000/api/analytics/attrition-trends?period=12"),
      ]);

    if (
      !dashboardRes.ok ||
      !departmentRes.ok ||
      !predictiveRes.ok ||
      !trendsRes.ok
    ) {
      throw new Error("Failed to fetch analytics data");
    }

    const [dashboard, departments, predictive, trends] = await Promise.all([
      dashboardRes.json(),
      departmentRes.json(),
      predictiveRes.json(),
      trendsRes.json(),
    ]);

    return {
      dashboard,
      departments,
      predictive,
      trends,
      error: null,
    };
  } catch (error) {
    console.error("Error loading reports data:", error);
    return {
      dashboard: null,
      departments: [],
      predictive: null,
      trends: [],
      error: "Failed to load reports data",
    };
  }
}

interface Insight {
  type: "critical" | "warning" | "positive" | "info";
  message: string;
}

export default function Reports() {
  const { dashboard, departments, predictive, trends, error } =
    useLoaderData<typeof loader>();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  // Calculate report period
  const currentDate = new Date();
  const reportPeriod = `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`;

  // Calculate insights from data
  const getTopInsights = (): Insight[] => {
    if (!dashboard || !departments || !predictive) return [];

    const insights: Insight[] = [];

    // Highest attrition department
    const highestAttritionDept = departments.reduce(
      (max: any, dept: any) =>
        dept.attrition_rate > (max?.attrition_rate || 0) ? dept : max,
      departments[0]
    );

    if (highestAttritionDept) {
      insights.push({
        type: "critical",
        message: `${highestAttritionDept.department} has lowest attrition rate (${highestAttritionDept.attrition_rate}%)`,
      });
    }

    // High risk employees - FIXED: Use correct field name with underscores
    const highRiskCount = predictive?.high_risk_employees?.length || 0;
    if (highRiskCount > 0) {
      insights.push({
        type: "warning",
        message: `${highRiskCount} employees identified as high flight risk`,
      });
    }

    // Department risk - FIXED: Use correct field name with underscores
    const highRiskDepts =
      predictive?.department_risks?.filter(
        (d: any) => d.risk_score >= 0.7
      ) || [];
    if (highRiskDepts.length > 0) {
      insights.push({
        type: "warning",
        message: `${highRiskDepts.length} department(s) at high risk for attrition`,
      });
    }

    // Positive insight
    if (
      dashboard.employeeStats?.avg_performance &&
      Number(dashboard.employeeStats.avg_performance) > 3.5
    ) {
      insights.push({
        type: "positive",
        message: `Strong average performance rating (${Number(dashboard.employeeStats.avg_performance).toFixed(2)}/5.0)`,
      });
    }

    return insights;
  };

  const insights = getTopInsights();

  const generatePDFReport = async () => {
    try {
      setIsGeneratingPDF(true);

      const response = await fetch(
        "http://localhost:5000/api/reports/generate-pdf",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/pdf",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `AttriSense-Report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadReport = async (reportType: string, format: string) => {
    try {
      setDownloadingReport(`${reportType}-${format}`);
      
      let endpoint = "";
      let filename = "";
      
      if (format === "pdf") {
        endpoint = "http://localhost:5000/api/reports/generate-pdf";
        filename = `AttriSense-${reportType}-${new Date().toISOString().split("T")[0]}.pdf`;
      } else if (format === "excel") {
        endpoint = "http://localhost:5000/api/employees/export?format=excel";
        filename = `AttriSense-${reportType}-${new Date().toISOString().split("T")[0]}.xlsx`;
      } else if (format === "csv") {
        endpoint = "http://localhost:5000/api/employees/export?format=csv";
        filename = `AttriSense-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()} report`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading ${format} report:`, error);
      alert(`Failed to download ${format.toUpperCase()} report. Please try again.`);
    } finally {
      setDownloadingReport(null);
    }
  };

  const quickReports = [
    {
      title: "Attrition Dashboard",
      description: "Comprehensive overview of attrition metrics and trends",
      icon: BarChart3,
      color: "bg-blue-500",
      type: "dashboard",
      metrics: [
        { label: "Total Employees", value: dashboard?.employeeStats?.total_employees || 0 },
        { label: "Attrition Rate", value: `${dashboard?.employeeStats?.attrition_rate || 0}%` },
      ],
    },
    {
      title: "Employee Risk Assessment",
      description: "Detailed analysis of employee attrition risk factors",
      icon: Users,
      color: "bg-yellow-500",
      type: "risk",
      metrics: [
        { label: "High Risk", value: predictive?.high_risk_employees?.length || 0 },
        { label: "Departments", value: departments?.length || 0 },
      ],
    },
    {
      title: "Department Analysis",
      description: "Department-wise attrition patterns and comparisons",
      icon: Building2,
      color: "bg-green-500",
      type: "department",
      metrics: [
        { label: "Departments", value: departments?.length || 0 },
        { label: "Avg Attrition", value: `${(departments?.reduce((sum: number, d: any) => sum + parseFloat(d.attrition_rate || 0), 0) / (departments?.length || 1)).toFixed(1)}%` },
      ],
    },
    {
      title: "Performance Analytics",
      description: "Performance ratings and their correlation with attrition",
      icon: Award,
      color: "bg-purple-500",
      type: "performance",
      metrics: [
        { label: "Avg Performance", value: `${Number(dashboard?.employeeStats?.avg_performance || 0).toFixed(2)}/5.0` },
        { label: "Active Employees", value: dashboard?.employeeStats?.active_employees || 0 },
      ],
    },
    {
      title: "Compensation Analysis",
      description: "Salary trends and compensation impact on retention",
      icon: DollarSign,
      color: "bg-indigo-500",
      type: "compensation",
      metrics: [
        { label: "Avg Salary", value: `₹${(dashboard?.employeeStats?.avg_salary || 0).toLocaleString()}` },
        { label: "Avg Tenure", value: `${Number(dashboard?.employeeStats?.avg_tenure || 0).toFixed(1)} yrs` },
      ],
    },
    {
      title: "Trend Analysis",
      description: "Historical trends and predictive analytics",
      icon: TrendingUp,
      color: "bg-teal-500",
      type: "trends",
      metrics: [
        { label: "Months Tracked", value: trends?.length || 0 },
        { label: "Trend Direction", value: trends?.length > 1 ? (trends[trends.length - 1].attrition_rate > trends[0].attrition_rate ? "↑" : "↓") : "-" },
      ],
    },
  ];

  const detailedReports = [
    {
      title: "Executive Summary Report",
      description: "Comprehensive overview of all attrition metrics and insights",
      icon: FileBarChart,
      color: "bg-purple-500",
      type: "executive",
      dataPoints: dashboard?.employeeStats?.total_employees || 0,
    },
    {
      title: "Department Deep Dive",
      description: "Detailed analysis of each department's attrition patterns",
      icon: Building2,
      color: "bg-blue-500",
      type: "department",
      dataPoints: departments?.length || 0,
    },
    {
      title: "Risk Factor Analysis",
      description: "Identification and analysis of key attrition risk factors",
      icon: AlertTriangle,
      color: "bg-red-500",
      type: "risk",
      dataPoints: predictive?.high_risk_employees?.length || 0,
    },
    {
      title: "Compensation & Benefits Analysis",
      description: "Salary trends and their impact on employee retention",
      icon: IndianRupee,
      color: "bg-green-500",
      type: "compensation",
      dataPoints: dashboard?.employeeStats?.total_employees || 0,
    },
    {
      title: "Performance Correlation Study",
      description: "Relationship between performance ratings and attrition",
      icon: Award,
      color: "bg-yellow-500",
      type: "performance",
      dataPoints: predictive?.high_risk_employees?.length || 0,
    },
    {
      title: "Predictive Attrition Model",
      description: "AI-powered predictions of future attrition risks",
      icon: Target,
      color: "bg-indigo-500",
      type: "predictive",
      dataPoints: predictive?.high_risk_employees?.length || 0,
    },
    {
      title: "Retention Strategy Recommendations",
      description: "Data-driven recommendations for improving retention",
      icon: UserX,
      color: "bg-teal-500",
      type: "retention",
      dataPoints: predictive?.retention_factors?.length || 0,
    },
    {
      title: "Quarterly Trends Report",
      description: "Historical trends and patterns over time",
      icon: Calendar,
      color: "bg-orange-500",
      type: "trends",
      dataPoints: trends?.length || 0,
    },
  ];

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">
              Failed to Load Reports Data
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Generate comprehensive reports and export data for further analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Report Period: {reportPeriod}</span>
            </div>
            <Button
              onClick={generatePDFReport}
              disabled={isGeneratingPDF}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Generate Executive PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="border-2 border-purple-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Executive Summary - {reportPeriod}</span>
            </CardTitle>
            <CardDescription>
              Key metrics and insights for the current reporting period
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Key Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Key Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-muted-foreground mb-1">Total Employees</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dashboard?.employeeStats?.total_employees || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="text-xs text-muted-foreground mb-1">Active Employees</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {dashboard?.employeeStats?.active_employees || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="text-xs text-muted-foreground mb-1">Attrition Rate</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {dashboard?.employeeStats?.attrition_rate || 0}%
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="text-xs text-muted-foreground mb-1">High Risk</div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {predictive?.high_risk_employees?.length || 0}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                    <div className="text-xs text-muted-foreground mb-1">Avg Performance</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Number(dashboard?.employeeStats?.avg_performance || 0).toFixed(2)}/5.0
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                    <div className="text-xs text-muted-foreground mb-1">Avg Tenure</div>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {Number(dashboard?.employeeStats?.avg_tenure || 0).toFixed(1)} yrs
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-muted-foreground mb-1">Average Salary</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {(dashboard?.employeeStats?.avg_salary || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Top Insights */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Top Insights
                </h4>
                <div className="space-y-3">
                  {insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          insight.type === "critical"
                            ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                            : insight.type === "warning"
                              ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500"
                              : insight.type === "positive"
                                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                                : "bg-blue-50 dark:bg-blue-950/20 border-blue-500"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {insight.type === "critical" && (
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          {insight.type === "warning" && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          )}
                          {insight.type === "positive" && (
                            <Award className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          )}
                          {insight.type === "info" && (
                            <Activity className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm font-medium">{insight.message}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500">
                      <div className="flex items-start space-x-3">
                        <Activity className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">
                          No significant insights at this time
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Additional static insights */}
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border-l-4 border-purple-500">
                    <div className="flex items-start space-x-3">
                      <Building2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">
                        {departments?.length || 0} departments tracked for attrition metrics
                      </span>
                    </div>
                  </div>

                  {trends && trends.length > 0 && (
                    <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border-l-4 border-indigo-500">
                      <div className="flex items-start space-x-3">
                        <LineChart className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">
                          {trends.length} months of historical trend data available
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs defaultValue="quick" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Quick Reports</span>
            </TabsTrigger>
            <TabsTrigger
              value="detailed"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Detailed Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickReports.map((report) => {
                const Icon = report.icon;
                return (
                  <Card
                    key={report.title}
                    className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${report.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">
                          {report.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        {report.metrics.map((metric, idx) => (
                          <div key={idx} className="p-2 rounded bg-muted/50">
                            <div className="text-xs text-muted-foreground">{metric.label}</div>
                            <div className="text-sm font-semibold">{metric.value}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Download Options */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Download As:</div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => downloadReport(report.type, "pdf")}
                            disabled={downloadingReport === `${report.type}-pdf`}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {downloadingReport === `${report.type}-pdf` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileBarChart className="h-3 w-3 mr-1" />
                            )}
                            PDF
                          </Button>
                          <Button
                            onClick={() => downloadReport(report.type, "excel")}
                            disabled={downloadingReport === `${report.type}-excel`}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {downloadingReport === `${report.type}-excel` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="h-3 w-3 mr-1" />
                            )}
                            Excel
                          </Button>
                          <Button
                            onClick={() => downloadReport(report.type, "csv")}
                            disabled={downloadingReport === `${report.type}-csv`}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {downloadingReport === `${report.type}-csv` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <FileText className="h-3 w-3 mr-1" />
                            )}
                            CSV
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {detailedReports.map((report, index) => {
                const Icon = report.icon;
                return (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow border-2 hover:border-purple-200"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20">
                              <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-lg">{report.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {report.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {report.description}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <BarChart3 className="h-3 w-3" />
                                <span>{report.dataPoints} data points</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Download Options */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            onClick={() => downloadReport(report.type, "pdf")}
                            disabled={downloadingReport === `${report.type}-pdf`}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {downloadingReport === `${report.type}-pdf` ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileBarChart className="h-3 w-3 mr-1" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => downloadReport(report.type, "excel")}
                            disabled={downloadingReport === `${report.type}-excel`}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {downloadingReport === `${report.type}-excel` ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Exporting...
                              </>
                            ) : (
                              <>
                                <FileSpreadsheet className="h-3 w-3 mr-1" />
                                Export Excel
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => downloadReport(report.type, "csv")}
                            disabled={downloadingReport === `${report.type}-csv`}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {downloadingReport === `${report.type}-csv` ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Exporting...
                              </>
                            ) : (
                              <>
                                <FileText className="h-3 w-3 mr-1" />
                                Export CSV
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
