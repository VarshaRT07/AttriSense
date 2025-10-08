import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  Frown,
  Heart,
  Meh,
  MessageSquare,
  Shield,
  Smile,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { Link, useLoaderData, useNavigate } from "react-router";
import { Layout } from "~/components/Layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import type { Employee, PulseSurvey } from "~/lib/interface";
import type { Route } from "./+types/surveys.$employeeId";

interface LoaderData {
  survey: PulseSurvey;
  employee: Employee;
  error: string | null;
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<LoaderData> {
  const { employeeId } = params;

  try {
    const surveyResponse = await fetch(
      `http://localhost:5000/api/pulse-surveys/employee/${employeeId}`
    );

    if (!surveyResponse.ok) {
      throw new Error("Survey not found");
    }

    const survey = await surveyResponse.json();

    // Fetch employee details
    const employeeResponse = await fetch(
      `http://localhost:5000/api/employees/${employeeId}`
    );
    const employee = employeeResponse.ok ? await employeeResponse.json() : null;
    console.log(survey);
    return {
      survey: survey[0],
      employee,
      error: null,
    };
  } catch (error) {
    return {
      survey: {} as PulseSurvey,
      employee: {} as Employee,
      error:
        error instanceof Error ? error.message : "Failed to load survey data",
    };
  }
}

export default function SurveyDetail() {
  const { survey, employee, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Error Loading Survey
                </h2>
                <p className="text-gray-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const getRatingText = (value: number) => {
    switch (value) {
      case 1:
        return "Strongly Disagree";
      case 2:
        return "Disagree";
      case 3:
        return "Neutral";
      case 4:
        return "Agree";
      case 5:
        return "Strongly Agree";
      default:
        return "N/A";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 4) return "from-green-500 to-green-600";
    if (score >= 3) return "from-yellow-500 to-yellow-600";
    return "from-red-500 to-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <Smile className="h-8 w-8" />;
    if (score >= 3) return <Meh className="h-8 w-8" />;
    return <Frown className="h-8 w-8" />;
  };

  const getScoreVariant = (score: number) => {
    if (score >= 4) return "default";
    if (score >= 3) return "secondary";
    return "destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 4) return "bg-green-500";
    if (score >= 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  const calculateOverallScore = () => {
    const scores = [
      survey.work_life_balance,
      survey.job_satisfaction,
      survey.relationship_with_manager,
      survey.communication_effectiveness,
      survey.recognition_reward_sat,
      survey.career_growth_opportunities,
      survey.alignment_with_company_values,
      survey.perceived_fairness,
      survey.team_cohesion_support,
      survey.autonomy_at_work,
      survey.overall_engagement,
      survey.training_skill_dev_sat,
      survey.stress_levels,
      survey.org_change_readiness,
      survey.feedback_usefulness,
      survey.flexibility_support,
      survey.conflict_at_work,
      survey.perceived_job_security,
      survey.environment_satisfaction,
    ].filter((score) => score !== null && score !== undefined);

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const surveyCategories = [
    {
      title: "Work Environment",
      icon: <Briefcase className="h-5 w-5" />,
      color: "blue",
      items: [
        {
          label: "Job Satisfaction",
          value: survey.job_satisfaction,
          icon: <Smile className="h-4 w-4" />,
        },
        {
          label: "Job Security",
          value: survey.perceived_job_security,
          icon: <Shield className="h-4 w-4" />,
        },
        {
          label: "Work Flexibility",
          value: survey.flexibility_support,
          icon: <Clock className="h-4 w-4" />,
        },
        {
          label: "Environment Satisfaction",
          value: survey.environment_satisfaction,
          icon: <Heart className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Career Growth",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "purple",
      items: [
        {
          label: "Career Growth Opportunities",
          value: survey.career_growth_opportunities,
          icon: <Target className="h-4 w-4" />,
        },
        {
          label: "Training & Skill Development",
          value: survey.training_skill_dev_sat,
          icon: <Award className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Leadership & Management",
      icon: <User className="h-5 w-5" />,
      color: "indigo",
      items: [
        {
          label: "Relationship with Manager",
          value: survey.relationship_with_manager,
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Communication Effectiveness",
          value: survey.communication_effectiveness,
          icon: <MessageSquare className="h-4 w-4" />,
        },
        {
          label: "Feedback Usefulness",
          value: survey.feedback_usefulness,
          icon: <Activity className="h-4 w-4" />,
        },
        {
          label: "Change Readiness",
          value: survey.org_change_readiness,
          icon: <Zap className="h-4 w-4" />,
        },
        {
          label: "Conflict at Work",
          value: survey.conflict_at_work,
          icon: <AlertCircle className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Team & Culture",
      icon: <Users className="h-5 w-5" />,
      color: "green",
      items: [
        {
          label: "Team Cohesion & Support",
          value: survey.team_cohesion_support,
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Recognition & Rewards",
          value: survey.recognition_reward_sat,
          icon: <Award className="h-4 w-4" />,
        },
        {
          label: "Company Values Alignment",
          value: survey.alignment_with_company_values,
          icon: <Target className="h-4 w-4" />,
        },
        {
          label: "Perceived Fairness",
          value: survey.perceived_fairness,
          icon: <Shield className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Work-Life Balance",
      icon: <Heart className="h-5 w-5" />,
      color: "pink",
      items: [
        {
          label: "Work-Life Balance",
          value: survey.work_life_balance,
          icon: <Heart className="h-4 w-4" />,
        },
        {
          label: "Stress Levels",
          value: survey.stress_levels,
          icon: <Activity className="h-4 w-4" />,
        },
        {
          label: "Autonomy at Work",
          value: survey.autonomy_at_work,
          icon: <Zap className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Overall Engagement",
      icon: <Zap className="h-5 w-5" />,
      color: "orange",
      items: [
        {
          label: "Overall Engagement",
          value: survey.overall_engagement,
          icon: <Zap className="h-4 w-4" />,
        },
      ],
    },
  ];

  const overallScore = calculateOverallScore();
  const totalQuestions = surveyCategories.reduce(
    (total, category) =>
      total +
      category.items.filter(
        (item) => item.value !== null && item.value !== undefined
      ).length,
    0
  );

  const getCategoryAverage = (category: (typeof surveyCategories)[0]) => {
    const validItems = category.items.filter(
      (item) => item.value !== null && item.value !== undefined
    );
    if (validItems.length === 0) return 0;
    return (
      validItems.reduce((sum, item) => sum + (item.value as number), 0) /
      validItems.length
    );
  };

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
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {employee?.full_name || "Employee"}
                      </h1>
                      <Badge
                        variant={getScoreVariant(overallScore)}
                        className="text-sm"
                      >
                        {overallScore >= 4
                          ? "Excellent"
                          : overallScore >= 3
                            ? "Good"
                            : "Needs Attention"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-2 flex items-center gap-2 text-base">
                      Pulse Survey Response • {formatDate(survey.survey_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {employee && (
                    <Link to={`/employees/${employee.employee_id}`}>
                      <Button variant="outline" size="default">
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Employee Info & Overall Score Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Score Card */}
            {/* Overall Score Card */}
            <Card className="lg:col-span-1 border-2">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="mb-3">
                    <div
                      className={`w-28 h-28 mx-auto rounded-full bg-gradient-to-br ${getScoreBgColor(
                        overallScore
                      )} flex items-center justify-center text-white shadow-lg`}
                    >
                      <div>
                        <div className="text-3xl font-bold">
                          {overallScore.toFixed(1)}
                        </div>
                        <div className="text-xs opacity-90">out of 5</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Overall Score
                  </h3>
                  <Badge
                    variant={getScoreVariant(overallScore)}
                    className="text-sm px-4 py-1"
                  >
                    {overallScore >= 4
                      ? "Excellent"
                      : overallScore >= 3
                        ? "Good"
                        : "Needs Attention"}
                  </Badge>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-semibold text-gray-900">
                        {totalQuestions}/19
                      </span>
                    </div>
                    <Progress
                      value={(totalQuestions / 19) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Information Card */}
            {employee?.employee_id && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Employee Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Full Name</span>
                      <p className="font-semibold text-gray-900 mt-1">
                        <Link
                          to={`/employees/${employee.employee_id}`}
                          className="hover:underline text-blue-600"
                        >
                          {employee.full_name}
                        </Link>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Job Role</span>
                      <p className="font-semibold text-gray-900 mt-1">
                        {employee.job_role}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Department
                      </span>
                      <p className="font-semibold text-gray-900 mt-1">
                        {employee.department}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Attrition Risk
                      </span>
                      <div className="mt-1">
                        <Badge
                          variant={
                            Number(employee.attrition_score) >= 0.7
                              ? "destructive"
                              : Number(employee.attrition_score) >= 0.4
                                ? "secondary"
                                : "default"
                          }
                          className="text-sm"
                        >
                          {(Number(employee.attrition_score) * 100).toFixed(
                            1
                          )}
                          % Risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Category Scores Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Category Scores Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {surveyCategories.map((category, index) => {
                  const avgScore = getCategoryAverage(category);
                  return (
                    <div
                      key={index}
                      className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div
                        className={`text-${category.color}-600 mb-2 flex justify-center`}
                      >
                        {category.icon}
                      </div>
                      <div
                        className={`text-2xl font-bold ${getScoreColor(avgScore)} mb-1`}
                      >
                        {avgScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {category.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          {/* Detailed Survey Responses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {surveyCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className={`text-${category.color}-600`}>
                      {category.icon}
                    </div>
                    <span>{category.title}</span>
                    <Badge variant="outline" className="ml-auto">
                      {getCategoryAverage(category).toFixed(1)}/5
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-5">
                    {category.items.map(
                      (item, itemIndex) =>
                        item.value !== null &&
                        item.value !== undefined && (
                          <div key={itemIndex} className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="text-gray-400">{item.icon}</div>
                                <span className="text-sm font-medium text-gray-700">
                                  {item.label}
                                </span>
                              </div>
                              <Badge
                                variant={getScoreVariant(item.value as number)}
                                className="text-xs shrink-0"
                              >
                                {item.value}/5
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress
                                value={((item.value as number) / 5) * 100}
                                className="h-2 flex-1"
                              />
                              <span className="text-xs text-gray-500 w-32 text-right">
                                {getRatingText(item.value as number)}
                              </span>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Attrition Analysis from Survey */}
          {survey.attrition_score && (
            <Card className="border-2 border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Survey-Based Attrition Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Attrition Risk Percentage - Full Width */}
                  <div className="flex items-center justify-center p-6 bg-white rounded-lg border-2 border-orange-300">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">
                        {(Number(survey.attrition_score) * 100).toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        Attrition Risk from Survey
                      </p>
                    </div>
                  </div>

                  {/* Risk and Retention Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {survey.top_negative_contributors &&
                      survey.top_negative_contributors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Retention Factors
                          </h4>
                          <div className="space-y-2">
                            {survey.top_negative_contributors.slice(0, 3).map(
                              (item: { feature: string; contribution: number }, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">
                                      {item.feature}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Impact: {item.contribution.toFixed(3)}
                                    </div>
                                  </div>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {survey.top_positive_contributors &&
                      survey.top_positive_contributors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Risk Factors
                          </h4>
                          <div className="space-y-2">
                            {survey.top_positive_contributors.slice(0, 3).map(
                              (item: { feature: string; contribution: number }, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">
                                      {item.feature}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      Impact: {item.contribution.toFixed(3)}
                                    </div>
                                  </div>
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-6 pb-4">
            {employee?.employee_id && (
              <Link to={`/employees/${employee.employee_id}`}>
                <Button className="gap-2">
                  <User className="h-4 w-4" />
                  View Employee Profile
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/data-management")}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Back to Data Management
            </Button>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}

export const meta = () => {
  return [
    { title: "Survey Details - AttriSense" },
    {
      name: "description",
      content: "View detailed pulse survey responses and AI-powered analysis",
    },
  ];
};
