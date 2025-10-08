 // Mock data for AttriSense

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  age: number;
  yearsAtCompany: number;
  performanceRating: number;
  satisfactionLevel: number;
  workLifeBalance: number;

  // Extended fields for comprehensive analysis
  promotions?: number;
  overtimeHours?: number;
  commuteDistance?: number;
  education?: string;
  maritalStatus?: string;
  numberOfDependents?: number;
  jobLevel?: number;

  // Multiple attrition risk types
  baseAttritionRisk?: number;
  pulseAttritionRisk?: number;
  combinedAttritionRisk?: number;
  attritionRisk: "Low" | "Medium" | "High";

  status: "Active" | "Left";
  exitDate?: string;
  exitReason?: string;
}

export interface PulseSurveyResponse {
  surveyId: string;
  employeeId: string;
  surveyDate: string;

  // Comprehensive survey fields (1-5 scale)
  workLifeBalance: number;
  jobSatisfaction: number;
  managerRelationship: number;
  communicationEffectiveness: number;
  recognitionRewardSatisfaction: number;
  careerGrowthOpportunities: number;
  companyValuesAlignment: number;
  perceivedFairness: number;
  teamCohesionSupport: number;
  autonomyAtWork: number;
  overallEngagement: number;
  trainingDevelopmentSatisfaction: number;
  stressLevels: number;
  changeReadiness: number;
  feedbackFrequencyUsefulness: number;
  flexibilitySupport: number;
  conflictAtWork: number;
  jobSecurity: number;
  environmentSatisfaction: number;

  comments?: string;
  surveyCompletionTime?: number; // in minutes
}

export interface AttritionMetrics {
  totalEmployees: number;
  totalAttrition: number;
  attritionRate: number;
  avgTenure: number;
  healthIndex?: number; // 0-100 organizational health score
  topAttritionDepartments: { department: string; rate: number }[];
  monthlyAttrition: { month: string; count: number }[];
  attritionByAge: { ageGroup: string; count: number }[];
  attritionReasons: { reason: string; count: number }[];
}

export interface ActionItem {
  actionId: string;
  employeeId: string;
  actionType: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  impactScore?: number;
  createdAt: string;
}

export const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    department: "Engineering",
    position: "Senior Developer",
    hireDate: "2020-03-15",
    salary: 95000,
    age: 32,
    yearsAtCompany: 4,
    performanceRating: 4.2,
    satisfactionLevel: 3.8,
    workLifeBalance: 3.5,
    attritionRisk: "Medium",
    status: "Active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    department: "Marketing",
    position: "Marketing Manager",
    hireDate: "2019-07-22",
    salary: 75000,
    age: 29,
    yearsAtCompany: 5,
    performanceRating: 4.5,
    satisfactionLevel: 4.2,
    workLifeBalance: 4.0,
    attritionRisk: "Low",
    status: "Active",
  },
  {
    id: "3",
    name: "Mike Davis",
    email: "mike.davis@company.com",
    department: "Sales",
    position: "Sales Representative",
    hireDate: "2021-01-10",
    salary: 55000,
    age: 26,
    yearsAtCompany: 3,
    performanceRating: 3.2,
    satisfactionLevel: 2.8,
    workLifeBalance: 2.5,
    attritionRisk: "High",
    status: "Left",
    exitDate: "2024-01-15",
    exitReason: "Better opportunity",
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily.chen@company.com",
    department: "HR",
    position: "HR Specialist",
    hireDate: "2018-09-05",
    salary: 65000,
    age: 35,
    yearsAtCompany: 6,
    performanceRating: 4.0,
    satisfactionLevel: 3.9,
    workLifeBalance: 4.2,
    attritionRisk: "Low",
    status: "Active",
  },
  {
    id: "5",
    name: "David Wilson",
    email: "david.wilson@company.com",
    department: "Finance",
    position: "Financial Analyst",
    hireDate: "2022-04-12",
    salary: 70000,
    age: 28,
    yearsAtCompany: 2,
    performanceRating: 3.8,
    satisfactionLevel: 3.5,
    workLifeBalance: 3.2,
    attritionRisk: "Medium",
    status: "Active",
  },
  {
    id: "6",
    name: "Lisa Brown",
    email: "lisa.brown@company.com",
    department: "Engineering",
    position: "Junior Developer",
    hireDate: "2023-02-01",
    salary: 65000,
    age: 24,
    yearsAtCompany: 1,
    performanceRating: 3.5,
    satisfactionLevel: 3.0,
    workLifeBalance: 3.8,
    attritionRisk: "Medium",
    status: "Active",
  },
  {
    id: "7",
    name: "Robert Taylor",
    email: "robert.taylor@company.com",
    department: "Operations",
    position: "Operations Manager",
    hireDate: "2017-11-20",
    salary: 85000,
    age: 42,
    yearsAtCompany: 7,
    performanceRating: 4.3,
    satisfactionLevel: 4.1,
    workLifeBalance: 3.7,
    attritionRisk: "Low",
    status: "Active",
  },
  {
    id: "8",
    name: "Jennifer Martinez",
    email: "jennifer.martinez@company.com",
    department: "Sales",
    position: "Sales Manager",
    hireDate: "2020-08-15",
    salary: 80000,
    age: 31,
    yearsAtCompany: 4,
    performanceRating: 4.1,
    satisfactionLevel: 3.6,
    workLifeBalance: 3.3,
    attritionRisk: "Medium",
    status: "Left",
    exitDate: "2023-12-20",
    exitReason: "Work-life balance",
  },
];

export const mockAttritionMetrics: AttritionMetrics = {
  totalEmployees: 150,
  totalAttrition: 25,
  attritionRate: 16.7,
  avgTenure: 3.2,
  topAttritionDepartments: [
    { department: "Sales", rate: 22.5 },
    { department: "Engineering", rate: 18.3 },
    { department: "Marketing", rate: 15.2 },
    { department: "Operations", rate: 12.1 },
    { department: "HR", rate: 8.7 },
    { department: "Finance", rate: 7.2 },
  ],
  monthlyAttrition: [
    { month: "Jan", count: 3 },
    { month: "Feb", count: 2 },
    { month: "Mar", count: 4 },
    { month: "Apr", count: 1 },
    { month: "May", count: 3 },
    { month: "Jun", count: 2 },
    { month: "Jul", count: 5 },
    { month: "Aug", count: 2 },
    { month: "Sep", count: 1 },
    { month: "Oct", count: 1 },
    { month: "Nov", count: 1 },
    { month: "Dec", count: 0 },
  ],
  attritionByAge: [
    { ageGroup: "20-25", count: 8 },
    { ageGroup: "26-30", count: 7 },
    { ageGroup: "31-35", count: 5 },
    { ageGroup: "36-40", count: 3 },
    { ageGroup: "41+", count: 2 },
  ],
  attritionReasons: [
    { reason: "Better opportunity", count: 8 },
    { reason: "Work-life balance", count: 6 },
    { reason: "Career growth", count: 4 },
    { reason: "Compensation", count: 3 },
    { reason: "Management issues", count: 2 },
    { reason: "Relocation", count: 2 },
  ],
};
