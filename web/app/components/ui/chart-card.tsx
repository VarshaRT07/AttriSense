import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

interface ChartCardProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: "blue" | "red" | "green" | "yellow" | "purple" | "orange";
  showValue?: boolean;
}

export function ProgressBar({
  label,
  value,
  maxValue,
  color = "blue",
  showValue = true,
}: ProgressBarProps) {
  const percentage = (value / maxValue) * 100;

  const colorClasses = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {showValue && (
          <span className="text-muted-foreground">
            {typeof value === "number" && value % 1 !== 0
              ? value.toFixed(1)
              : value}
            {typeof value === "number" && value <= 5 ? "" : "%"}
          </span>
        )}
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <div
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
