import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}: MetricCardProps) {
  const changeColors = {
    positive:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    negative: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <Badge variant="secondary" className={changeColors[changeType]}>
              {change}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
