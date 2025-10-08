import {
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface InsightCardProps {
  type: "warning" | "success" | "info" | "danger";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function InsightCard({
  type,
  title,
  description,
  action,
}: InsightCardProps) {
  const config = {
    warning: {
      icon: AlertTriangle,
      className:
        "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      titleColor: "text-yellow-800 dark:text-yellow-200",
      descColor: "text-yellow-700 dark:text-yellow-300",
    },
    success: {
      icon: TrendingUp,
      className:
        "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400",
      titleColor: "text-green-800 dark:text-green-200",
      descColor: "text-green-700 dark:text-green-300",
    },
    info: {
      icon: Lightbulb,
      className:
        "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleColor: "text-blue-800 dark:text-blue-200",
      descColor: "text-blue-700 dark:text-blue-300",
    },
    danger: {
      icon: TrendingDown,
      className:
        "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
      iconColor: "text-red-600 dark:text-red-400",
      titleColor: "text-red-800 dark:text-red-200",
      descColor: "text-red-700 dark:text-red-300",
    },
  };

  const {
    icon: Icon,
    className,
    iconColor,
    titleColor,
    descColor,
  } = config[type];

  return (
    <Alert className={className}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <div className="flex-1">
        <h4 className={`text-sm font-medium ${titleColor}`}>{title}</h4>
        <AlertDescription className={`mt-1 ${descColor}`}>
          {description}
        </AlertDescription>
      </div>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="ml-auto"
        >
          {action.label}
        </Button>
      )}
    </Alert>
  );
}

interface RiskBadgeProps {
  risk: "Low" | "Medium" | "High";
  className?: string;
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const variants = {
    Low: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400",
    Medium:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
    High: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <Badge variant="secondary" className={`${variants[risk]} ${className}`}>
      {risk}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: "Active" | "Left";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    Active:
      "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400",
    Left: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400",
  };

  return (
    <Badge variant="secondary" className={`${variants[status]} ${className}`}>
      {status}
    </Badge>
  );
}
