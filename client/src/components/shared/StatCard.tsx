import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "warning" | "success" | "danger";
}

const variantClasses = {
  default: "bg-muted/50 border-muted",
  primary: "bg-primary/5 border-primary/20",
  warning: "bg-warning/5 border-warning/20",
  success: "bg-success/5 border-success/20",
  danger: "bg-danger/5 border-danger/20",
};

export function StatCard({
  icon,
  label,
  value,
  variant = "default",
}: StatCardProps) {
  return (
    <Card variant="stat" className={variantClasses[variant]}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-current/10">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
