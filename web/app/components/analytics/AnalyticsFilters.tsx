import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface AnalyticsFiltersProps {
  departments: string[];
  jobLevels: number[];
  selectedDepartment: string;
  selectedJobLevel: number | null;
  onDepartmentChange: (value: string) => void;
  onJobLevelChange: (value: number | null) => void;
  onReset: () => void;
}

export function AnalyticsFilters({
  departments,
  jobLevels,
  selectedDepartment,
  selectedJobLevel,
  onDepartmentChange,
  onJobLevelChange,
  onReset,
}: AnalyticsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select 
            value={selectedJobLevel?.toString() || ""} 
            onValueChange={(value) => onJobLevelChange(value ? parseInt(value) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Job Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Levels</SelectItem>
              {jobLevels.map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  Level {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={onReset}>
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}