import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Edit,
  IndianRupee,
  MapPin,
  Save,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { Layout } from "~/components/Layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Employee, PulseSurvey } from "~/lib/interface";
import type { Route } from "./+types/employees.$employeeId";

interface LoaderData {
  employee: Employee;
  pulseSurveys: PulseSurvey[];
  error: string | null;
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<LoaderData> {
  const { employeeId } = params;

  try {
    const [employeeResponse, surveysResponse] = await Promise.all([
      fetch(`http://localhost:5000/api/employees/${employeeId}`),
      fetch(`http://localhost:5000/api/pulse-surveys/employee/${employeeId}`),
    ]);

    if (!employeeResponse.ok) {
      throw new Error("Employee not found");
    }

    const employee = await employeeResponse.json();
    const pulseSurveys = surveysResponse.ok ? await surveysResponse.json() : [];
    return {
      employee,
      pulseSurveys,
      error: null,
    };
  } catch (error) {
    return {
      employee: {} as Employee,
      pulseSurveys: [],
      error:
        error instanceof Error ? error.message : "Failed to load employee data",
    };
  }
}

export default function EmployeeDetail() {
  const { employee, pulseSurveys, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  console.log(employee);

  // Form state management
  const [formData, setFormData] = useState(employee);
  const [saving, setSaving] = useState(false);
  const pulseSurvey_attrition_score =
    pulseSurveys.length > 0
      ? pulseSurveys[pulseSurveys.length - 1].attrition_score
      : 0;

  // Update form data when employee data changes
  useEffect(() => {
    setFormData(employee);
  }, [employee]);

  // Handle input changes with proper type casting
  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  console.log("Form Data:", formData);

  // Handle save functionality
  const handleSave = async () => {
    setSaving(true);
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
      "Employee ID": formData.employee_id || 999,
      "Full Name": formData.full_name || "",
      Age: Number(formData.age) || 0,
      Gender: mapGender(formData.gender),
      "Years of experience": Number(formData.years_of_experience) || 0,
      "Job Role": formData.job_role || "",
      Salary: Number(formData.salary) || 0,
      "Performance Rating":
        Math.round(Number(formData.performance_rating)) || 0,
      "Number of Promotions": Number(formData.number_of_promotions) || 0,
      Overtime: formData.overtime ? "Yes" : "No",
      "Commuting distance": Number(formData.commuting_distance) || 0,
      "Education Level": formData.education_level || "",
      "Marital Status": formData.marital_status || "",
      "Number of Dependents": Number(formData.number_of_dependents) || 0,
      "Job Level": Number(formData.job_level) || 0,
      "Last hike": Number(formData.last_hike) || 0,
      "Years in current role": Number(formData.years_in_current_role) || 0,
      "Working model": formData.working_model || "",
      "Working hours": Number(formData.working_hours) || 40,
      Department: formData.department || "",
      "No. of companies worked previously":
        Number(formData.no_of_companies_worked_previously) || 0,
      LeavesTaken: Number(formData.leaves_taken) || 0,
      YearsWithCompany: Number(formData.years_with_company) || 0,
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

    // Merge form data + prediction for backend
    const finalEmployeeData = {
      ...formData,
      performance_rating: Math.round(Number(formData.performance_rating)) || 0,
      number_of_promotions:
        Math.round(Number(formData.number_of_promotions)) || 0,
      job_level: Math.round(Number(formData.job_level)) || 0,
      years_in_current_role:
        Math.round(Number(formData.years_in_current_role)) || 0,
      leaves_taken: Math.round(Number(formData.leaves_taken)) || 0,
      no_of_companies_worked_previously:
        Math.round(Number(formData.no_of_companies_worked_previously)) || 0,
      years_with_company: Math.round(Number(formData.years_with_company)) || 0,

      // Attrition fields
      attrition_score: prediction.attrition_probability || 0.5,
      attrition: (prediction.attrition_probability || 0) > 0.5 ? 1 : 0,

      top_positive_contributors: prediction.top_positive_contributors || [],
      top_negative_contributors: prediction.top_negative_contributors || [],
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${formData.employee_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalEmployeeData),
        }
      );

      if (response.ok) {
        // Success - exit edit mode
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("mode");
        setSearchParams(newParams);

        console.log("Employee updated successfully");
      } else {
        throw new Error("Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("mode");
      setSearchParams(newParams);
      // Reset form data when canceling
      setFormData(employee);
    } else {
      setSearchParams({ mode: "edit" });
    }
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 0.7) return "High Risk";
    if (score >= 0.4) return "Medium Risk";
    return "Low Risk";
  };

  const getRiskColor = (score: number): string => {
    if (score >= 0.7) return "text-red-600";
    if (score >= 0.4) return "text-orange-600";
    return "text-green-600";
  };

  const getRiskBgColor = (score: number): string => {
    if (score >= 0.7) return "from-red-500 to-red-600";
    if (score >= 0.4) return "from-orange-500 to-orange-600";
    return "from-green-500 to-green-600";
  };

  const getRiskBorderColor = (score: number): string => {
    if (score >= 0.7) return "border-red-200";
    if (score >= 0.4) return "border-orange-200";
    return "border-green-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatGender = (gender: string | undefined): string => {
    if (!gender) return "Not specified";
    switch (gender.toUpperCase()) {
      case "M":
        return "Male";
      case "F":
        return "Female";
      case "O":
        return "Other";
      default:
        return gender;
    }
  };

  const combinedScore =
    (Number(formData.attrition_score) + Number(pulseSurvey_attrition_score)) /
    2;

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/data-management")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Error Loading Employee
                </h2>
                <p className="text-gray-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Break out of Layout padding for full-width design */}
      <div className="-m-6">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-full mx-auto px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/data-management")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {formData.full_name}
                      </h1>
                      <Badge
                        variant={
                          Number(formData?.attrition_score) >= 0.7
                            ? "destructive"
                            : Number(formData?.attrition_score) >= 0.4
                              ? "warning"
                              : "stable"
                        }
                        className="text-sm"
                      >
                        {Number(formData?.attrition_score) >= 0.7
                          ? "Critical"
                          : Number(formData?.attrition_score) >= 0.4
                            ? "At Risk"
                            : "Stable"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-2 flex items-center gap-2 text-base">
                      {formData.job_role} • {formData.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditMode && (
                    <Button
                      onClick={toggleEditMode}
                      variant="outline"
                      size="default"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                  {isEditMode && (
                    <>
                      <Button
                        variant="outline"
                        onClick={toggleEditMode}
                        disabled={saving}
                        size="default"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="default"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-full mx-auto px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Attrition Risk Card */}
              <div className="lg:col-span-1">
                <Card
                  className={`border-2 ${getRiskBorderColor(combinedScore)} shadow-lg`}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Attrition Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Risk Score Circle */}
                    <div className="flex flex-col items-center justify-center py-6">
                      <div
                        className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${getRiskBgColor(combinedScore)} flex items-center justify-center shadow-xl`}
                      >
                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div
                              className={`text-3xl font-bold ${getRiskColor(combinedScore)}`}
                            >
                              {(combinedScore * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Risk Score
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <div
                          className={`text-lg font-semibold ${getRiskColor(combinedScore)}`}
                        >
                          {getRiskLevel(combinedScore)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Combined assessment
                        </p>
                      </div>
                    </div>

                    {/* Risk Breakdown */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-semibold text-sm text-gray-700">
                        Risk Components
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Demographics and Job factors
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {(Number(formData.attrition_score) * 100).toFixed(
                              0
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Number(formData.attrition_score) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          Based on demographics & performance
                        </p>
                      </div>

                      {/* Pulse Survey Score */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Pulse Survey
                          </span>
                          <span className="text-sm font-bold text-purple-600">
                            {(
                              Number(pulseSurvey_attrition_score) * 100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Number(pulseSurvey_attrition_score) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          Based on engagement & satisfaction
                        </p>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="space-y-4 pt-4 border-t">
                      {/* Positive Factors (Why They Might Stay) */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Retention Factors
                        </h4>
                        <div className="space-y-2">
                          {formData.top_negative_contributors
                            ?.slice(0, 3)
                            .map(
                              (
                                item: { feature: string; contribution: number },
                                index: number
                              ) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-800">
                                      {item.feature}
                                    </div>
                                  </div>
                                  <TrendingDown className="h-4 w-4 text-green-600" />
                                </div>
                              )
                            )}
                        </div>
                      </div>

                      {/* Negative Factors (Why They Might Leave) */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Risk Factors
                        </h4>
                        <div className="space-y-2">
                          {formData.top_positive_contributors
                            ?.slice(0, 3)
                            .map(
                              (
                                item: { feature: string; contribution: number },
                                index: number
                              ) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-800">
                                      {item.feature}
                                    </div>
                                  </div>
                                  <TrendingUp className="h-4 w-4 text-red-600" />
                                </div>
                              )
                            )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Employee Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tenure</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formData.years_with_company}y
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Performance</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formData.performance_rating}/5
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <IndianRupee className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Salary</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(Number(formData.salary)).replace(
                              ".00",
                              ""
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Target className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Promotions</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formData.number_of_promotions}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name || ""}
                            onChange={(e) =>
                              handleInputChange("full_name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            value={formData.age || ""}
                            onChange={(e) =>
                              handleInputChange("age", Number(e.target.value))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={formData.gender || ""}
                            onValueChange={(value) =>
                              handleInputChange("gender", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">Male</SelectItem>
                              <SelectItem value="F">Female</SelectItem>
                              <SelectItem value="O">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="marital_status">Marital Status</Label>
                          <Select
                            value={formData.marital_status || ""}
                            onValueChange={(value) =>
                              handleInputChange("marital_status", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                              <SelectItem value="Divorced">Divorced</SelectItem>
                              <SelectItem value="Widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="number_of_dependents">
                            Number of Dependents
                          </Label>
                          <Input
                            id="number_of_dependents"
                            type="number"
                            value={formData.number_of_dependents || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "number_of_dependents",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="education_level">
                            Education Level
                          </Label>
                          <Select
                            value={String(formData.education_level || "")}
                            onValueChange={(value) =>
                              handleInputChange("education_level", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="School">School</SelectItem>
                              <SelectItem value="Graduate">Graduate</SelectItem>
                              <SelectItem value="Post Graduate">
                                Post Graduate
                              </SelectItem>
                              <SelectItem value="Diploma">Diploma</SelectItem>
                              <SelectItem value="Doctorate">
                                Doctorate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Age</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.age} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Gender</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formatGender(formData.gender)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Marital Status
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.marital_status}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dependents</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.number_of_dependents}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Education</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.education_level}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            #{formData.employee_id}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job_role">Job Role</Label>
                          <Input
                            id="job_role"
                            value={formData.job_role || ""}
                            onChange={(e) =>
                              handleInputChange("job_role", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Select
                            value={formData.department || ""}
                            onValueChange={(value) =>
                              handleInputChange("department", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Engineering">
                                Engineering
                              </SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Marketing">
                                Marketing
                              </SelectItem>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="years_of_experience">
                            Years of Experience
                          </Label>
                          <Input
                            id="years_of_experience"
                            type="number"
                            value={formData.years_of_experience || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "years_of_experience",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="job_level">Job Level</Label>
                          <Input
                            id="job_level"
                            type="number"
                            value={formData.job_level || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "job_level",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="performance_rating">
                            Performance Rating (1-5)
                          </Label>
                          <Input
                            id="performance_rating"
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={formData.performance_rating || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "performance_rating",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="number_of_promotions">
                            Number of Promotions
                          </Label>
                          <Input
                            id="number_of_promotions"
                            type="number"
                            value={formData.number_of_promotions || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "number_of_promotions",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="years_with_company">
                            Years with Company
                          </Label>
                          <Input
                            id="years_with_company"
                            type="number"
                            value={formData.years_with_company || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "years_with_company",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="years_in_current_role">
                            Years in Current Role
                          </Label>
                          <Input
                            id="years_in_current_role"
                            type="number"
                            value={formData.years_in_current_role || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "years_in_current_role",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="no_of_companies_worked_previously">
                            Previous Companies
                          </Label>
                          <Input
                            id="no_of_companies_worked_previously"
                            type="number"
                            value={
                              formData.no_of_companies_worked_previously || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "no_of_companies_worked_previously",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Experience</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.years_of_experience} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Job Level</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.job_level}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Performance</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.performance_rating}/5.0
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Promotions</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.number_of_promotions}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Years with Company
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.years_with_company} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current Role</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.years_in_current_role} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Previous Companies
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.no_of_companies_worked_previously}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Compensation & Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5" />
                      Compensation & Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="salary">Monthly Salary</Label>
                          <Input
                            id="salary"
                            type="number"
                            value={formData.salary || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "salary",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_hike">Last Hike (%)</Label>
                          <Input
                            id="last_hike"
                            type="number"
                            step="0.01"
                            value={formData.last_hike || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "last_hike",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-4">
                          <Checkbox
                            id="overtime"
                            checked={formData.overtime || false}
                            onCheckedChange={(checked) =>
                              handleInputChange("overtime", checked === true)
                            }
                          />
                          <Label
                            htmlFor="overtime"
                            className="text-sm font-normal"
                          >
                            Overtime Eligible
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">
                            Monthly Salary
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formatCurrency(Number(formData.salary))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Hike</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.last_hike}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Overtime</p>
                          <Badge
                            variant={
                              formData.overtime ? "default" : "secondary"
                            }
                            className="mt-1"
                          >
                            {formData.overtime ? "Eligible" : "Not Eligible"}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Work Setup */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Work Setup & Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="working_model">Working Model</Label>
                          <Select
                            value={formData.working_model || ""}
                            onValueChange={(value) =>
                              handleInputChange("working_model", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select working model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Remote">Remote</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                              <SelectItem value="Onsite">Onsite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="working_hours">
                            Working Hours/day
                          </Label>
                          <Input
                            id="working_hours"
                            type="number"
                            value={formData.working_hours || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "working_hours",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="commuting_distance">
                            Commuting Distance (km)
                          </Label>
                          <Input
                            id="commuting_distance"
                            type="number"
                            value={formData.commuting_distance || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "commuting_distance",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leaves_taken">
                            Leaves Taken (days)
                          </Label>
                          <Input
                            id="leaves_taken"
                            type="number"
                            value={formData.leaves_taken || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "leaves_taken",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Working Model</p>
                          <Badge variant="outline" className="mt-1">
                            {formData.working_model}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Working Hours</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.working_hours}h/day
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Commute Distance
                          </p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.commuting_distance} km
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Leaves Taken</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {formData.leaves_taken} days
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pulse Survey Summary - Full Width Below Grid */}
            {pulseSurveys.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Latest Pulse Survey
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">Work-Life Balance</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {
                          pulseSurveys[pulseSurveys.length - 1]
                            .work_life_balance
                        }
                        /5
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600">Job Satisfaction</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {pulseSurveys[pulseSurveys.length - 1].job_satisfaction}
                        /5
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        Overall Engagement
                      </p>
                      <p className="text-lg font-bold text-purple-600 mt-1">
                        {
                          pulseSurveys[pulseSurveys.length - 1]
                            .overall_engagement
                        }
                        /5
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-gray-600">Career Growth</p>
                      <p className="text-lg font-bold text-orange-600 mt-1">
                        {
                          pulseSurveys[pulseSurveys.length - 1]
                            .career_growth_opportunities
                        }
                        /5
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        Relationship with Manager
                      </p>
                      <p className="text-lg font-bold text-red-600 mt-1">
                        {
                          pulseSurveys[pulseSurveys.length - 1]
                            .relationship_with_manager
                        }
                        /5
                      </p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        Communication Effectiveness
                      </p>
                      <p className="text-lg font-bold text-pink-600 mt-1">
                        {
                          pulseSurveys[pulseSurveys.length - 1]
                            .communication_effectiveness
                        }
                        /5
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const meta = () => {
  return [
    { title: "Employee Details - AttriSense" },
    {
      name: "description",
      content:
        "View detailed employee information and AI-powered attrition insights",
    },
  ];
};
