// components/ui/create-employee-modal.tsx
import {
  Briefcase,
  CheckCircle2,
  DollarSign,
  IdCard,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Employee } from "~/lib/interface";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: Partial<Employee>) => void;
  isSubmitting?: boolean;
}

export function CreateEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateEmployeeModalProps) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    employee_id: undefined,
    full_name: "",
    age: undefined,
    gender: undefined,
    years_of_experience: undefined,
    job_role: "",
    salary: undefined,
    performance_rating: undefined,
    number_of_promotions: undefined,
    overtime: false,
    commuting_distance: undefined,
    education_level: undefined,
    marital_status: undefined,
    number_of_dependents: undefined,
    job_level: undefined,
    last_hike: undefined,
    years_in_current_role: undefined,
    working_model: undefined,
    working_hours: undefined,
    department: "",
    no_of_companies_worked_previously: undefined,
    leaves_taken: undefined,
    years_with_company: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic Information
    if (!formData.employee_id) newErrors.employee_id = "Required";
    if (!formData.full_name?.trim()) newErrors.full_name = "Required";
    if (!formData.age || formData.age < 18 || formData.age > 70)
      newErrors.age = "Age must be 18-70";

    // Personal Details
    if (!formData.gender) newErrors.gender = "Required";
    if (!formData.marital_status) newErrors.marital_status = "Required";
    if (
      formData.number_of_dependents === undefined ||
      formData.number_of_dependents < 0
    )
      newErrors.number_of_dependents = "Required";
    if (!formData.education_level) newErrors.education_level = "Required";
    if (
      formData.commuting_distance === undefined ||
      formData.commuting_distance < 0
    )
      newErrors.commuting_distance = "Required";

    // Professional Details
    if (!formData.department?.trim()) newErrors.department = "Required";
    if (!formData.job_role?.trim()) newErrors.job_role = "Required";
    if (
      formData.years_of_experience === undefined ||
      formData.years_of_experience < 0
    )
      newErrors.years_of_experience = "Required";
    if (
      !formData.job_level ||
      formData.job_level < 1 ||
      formData.job_level > 10
    )
      newErrors.job_level = "Job level must be 1-10";
    if (
      !formData.performance_rating ||
      formData.performance_rating < 1 ||
      formData.performance_rating > 5
    )
      newErrors.performance_rating = "Rating must be 1-5";
    if (!formData.working_model) newErrors.working_model = "Required";
    if (
      formData.working_hours === undefined ||
      formData.working_hours < 7 ||
      formData.working_hours > 11
    )
      newErrors.working_hours = "Working hours must be 7-11";
    if (
      formData.years_in_current_role === undefined ||
      formData.years_in_current_role < 0
    )
      newErrors.years_in_current_role = "Required";
    if (
      formData.no_of_companies_worked_previously === undefined ||
      formData.no_of_companies_worked_previously < 0
    )
      newErrors.no_of_companies_worked_previously = "Required";
    if (
      formData.years_with_company === undefined ||
      formData.years_with_company < 0
    )
      newErrors.years_with_company = "Required";

    // Compensation
    if (!formData.salary || formData.salary < 0) newErrors.salary = "Required";
    if (formData.last_hike === undefined || formData.last_hike < 0)
      newErrors.last_hike = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onClose();
      }, 2000);
    }
  };

  const handleInputChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: undefined,
      full_name: "",
      age: undefined,
      gender: undefined,
      years_of_experience: undefined,
      job_role: "",
      salary: undefined,
      performance_rating: undefined,
      number_of_promotions: undefined,
      overtime: false,
      commuting_distance: undefined,
      education_level: undefined,
      marital_status: undefined,
      number_of_dependents: undefined,
      job_level: undefined,
      last_hike: undefined,
      years_in_current_role: undefined,
      working_model: undefined,
      working_hours: undefined,
      department: "",
      no_of_companies_worked_previously: undefined,
      leaves_taken: undefined,
      years_with_company: undefined,
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Employee Created Successfully!
            </h3>
            <p className="text-gray-600">
              {formData.full_name} has been added to the system.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            Create New Employee
          </DialogTitle>
          <DialogDescription>All fields are required unless specified otherwise.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto space-y-6 pr-2"
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
              <IdCard className="h-4 w-4 text-blue-600" />
              Basic Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  type="number"
                  value={formData.employee_id || ""}
                  onChange={(e) =>
                    handleInputChange("employee_id", parseInt(e.target.value))
                  }
                  className={errors.employee_id ? "border-red-500" : ""}
                  placeholder="e.g., 1001"
                />
                {errors.employee_id && (
                  <p className="text-xs text-red-600">{errors.employee_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ""}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  className={errors.full_name ? "border-red-500" : ""}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <p className="text-xs text-red-600">{errors.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="70"
                  value={formData.age || ""}
                  onChange={(e) =>
                    handleInputChange("age", parseInt(e.target.value))
                  }
                  className={errors.age ? "border-red-500" : ""}
                  placeholder="30"
                />
                {errors.age && (
                  <p className="text-xs text-red-600">{errors.age}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
              <User className="h-4 w-4 text-green-600" />
              Personal Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger
                    className={errors.gender ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-xs text-red-600">{errors.gender}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select
                  value={formData.marital_status || ""}
                  onValueChange={(value) =>
                    handleInputChange("marital_status", value)
                  }
                >
                  <SelectTrigger
                    className={errors.marital_status ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marital_status && (
                  <p className="text-xs text-red-600">
                    {errors.marital_status}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_dependents">Dependents</Label>
                <Input
                  id="number_of_dependents"
                  type="number"
                  min="0"
                  value={formData.number_of_dependents ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "number_of_dependents",
                      parseInt(e.target.value)
                    )
                  }
                  className={
                    errors.number_of_dependents ? "border-red-500" : ""
                  }
                  placeholder="0"
                />
                {errors.number_of_dependents && (
                  <p className="text-xs text-red-600">
                    {errors.number_of_dependents}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="education_level">
                  Education Level <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.education_level || ""}
                  onValueChange={(value) =>
                    handleInputChange("education_level", value)
                  }
                >
                  <SelectTrigger
                    className={errors.education_level ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School">School</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="Graduate">Graduate</SelectItem>
                    <SelectItem value="Post-Graduate">Post-Graduate</SelectItem>
                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
                {errors.education_level && (
                  <p className="text-xs text-red-600">
                    {errors.education_level}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="commuting_distance">
                  Commuting Distance (km){" "}
                </Label>
                <Input
                  id="commuting_distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.commuting_distance ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "commuting_distance",
                      parseFloat(e.target.value)
                    )
                  }
                  className={errors.commuting_distance ? "border-red-500" : ""}
                  placeholder="10"
                />
                {errors.commuting_distance && (
                  <p className="text-xs text-red-600">
                    {errors.commuting_distance}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
              <Briefcase className="h-4 w-4 text-purple-600" />
              Professional Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ""}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  className={errors.department ? "border-red-500" : ""}
                  placeholder="Engineering"
                />
                {errors.department && (
                  <p className="text-xs text-red-600">{errors.department}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_role">Job Role</Label>
                <Input
                  id="job_role"
                  value={formData.job_role || ""}
                  onChange={(e) =>
                    handleInputChange("job_role", e.target.value)
                  }
                  className={errors.job_role ? "border-red-500" : ""}
                  placeholder="Software Engineer"
                />
                {errors.job_role && (
                  <p className="text-xs text-red-600">{errors.job_role}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Experience (years)</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  min="0"
                  value={formData.years_of_experience || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "years_of_experience",
                      parseInt(e.target.value)
                    )
                  }
                  className={errors.years_of_experience ? "border-red-500" : ""}
                  placeholder="5"
                />
                {errors.years_of_experience && (
                  <p className="text-xs text-red-600">
                    {errors.years_of_experience}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_level">Job Level</Label>
                <Input
                  id="job_level"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.job_level ?? ""}
                  onChange={(e) =>
                    handleInputChange("job_level", parseInt(e.target.value))
                  }
                  className={errors.job_level ? "border-red-500" : ""}
                  placeholder="1-10"
                />
                {errors.job_level && (
                  <p className="text-xs text-red-600">{errors.job_level}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="performance_rating">Performance Rating</Label>
                <Input
                  id="performance_rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.performance_rating ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "performance_rating",
                      parseInt(e.target.value)
                    )
                  }
                  className={errors.performance_rating ? "border-red-500" : ""}
                  placeholder="1-5"
                />
                {errors.performance_rating && (
                  <p className="text-xs text-red-600">
                    {errors.performance_rating}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="working_model">
                  Working Model <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.working_model || ""}
                  onValueChange={(value) =>
                    handleInputChange("working_model", value)
                  }
                >
                  <SelectTrigger
                    className={errors.working_model ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
                {errors.working_model && (
                  <p className="text-xs text-red-600">{errors.working_model}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="working_hours">Working Hours (per day) </Label>
                <Input
                  id="working_hours"
                  type="number"
                  min="7"
                  max="11"
                  value={formData.working_hours ?? ""}
                  onChange={(e) =>
                    handleInputChange("working_hours", parseInt(e.target.value))
                  }
                  className={errors.working_hours ? "border-red-500" : ""}
                  placeholder="7-11"
                />
                {errors.working_hours && (
                  <p className="text-xs text-red-600">{errors.working_hours}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_in_current_role">
                  Years in Current Role
                </Label>
                <Input
                  id="years_in_current_role"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.years_in_current_role ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "years_in_current_role",
                      parseFloat(e.target.value)
                    )
                  }
                  className={
                    errors.years_in_current_role ? "border-red-500" : ""
                  }
                  placeholder="2"
                />
                {errors.years_in_current_role && (
                  <p className="text-xs text-red-600">
                    {errors.years_in_current_role}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="no_of_companies_worked_previously">
                  Previous Companies
                </Label>
                <Input
                  id="no_of_companies_worked_previously"
                  type="number"
                  min="0"
                  value={formData.no_of_companies_worked_previously ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "no_of_companies_worked_previously",
                      parseInt(e.target.value)
                    )
                  }
                  className={
                    errors.no_of_companies_worked_previously
                      ? "border-red-500"
                      : ""
                  }
                  placeholder="0"
                />
                {errors.no_of_companies_worked_previously && (
                  <p className="text-xs text-red-600">
                    {errors.no_of_companies_worked_previously}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_with_company">Years with Company</Label>
                <Input
                  id="years_with_company"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.years_with_company ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "years_with_company",
                      parseFloat(e.target.value)
                    )
                  }
                  className={errors.years_with_company ? "border-red-500" : ""}
                  placeholder="3"
                />
                {errors.years_with_company && (
                  <p className="text-xs text-red-600">
                    {errors.years_with_company}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              Compensation
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  value={formData.salary ?? ""}
                  onChange={(e) =>
                    handleInputChange("salary", parseFloat(e.target.value))
                  }
                  className={errors.salary ? "border-red-500" : ""}
                  placeholder="50000"
                />
                {errors.salary && (
                  <p className="text-xs text-red-600">{errors.salary}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_hike">Last Hike (%)</Label>
                <Input
                  id="last_hike"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.last_hike ?? ""}
                  onChange={(e) =>
                    handleInputChange("last_hike", parseFloat(e.target.value))
                  }
                  className={errors.last_hike ? "border-red-500" : ""}
                  placeholder="10"
                />
                {errors.last_hike && (
                  <p className="text-xs text-red-600">{errors.last_hike}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_promotions">Promotions</Label>
                <Input
                  id="number_of_promotions"
                  type="number"
                  min="0"
                  value={formData.number_of_promotions ?? 0}
                  onChange={(e) =>
                    handleInputChange(
                      "number_of_promotions",
                      parseInt(e.target.value)
                    )
                  }
                  className={
                    errors.number_of_promotions ? "border-red-500" : ""
                  }
                  placeholder="0"
                />
                {errors.number_of_promotions && (
                  <p className="text-xs text-red-600">
                    {errors.number_of_promotions}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaves_taken">Leaves Taken</Label>
                <Input
                  id="leaves_taken"
                  type="number"
                  min="0"
                  value={formData.leaves_taken ?? 0}
                  onChange={(e) =>
                    handleInputChange("leaves_taken", parseInt(e.target.value))
                  }
                  className={errors.leaves_taken ? "border-red-500" : ""}
                  placeholder="0"
                />
                {errors.leaves_taken && (
                  <p className="text-xs text-red-600">{errors.leaves_taken}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
