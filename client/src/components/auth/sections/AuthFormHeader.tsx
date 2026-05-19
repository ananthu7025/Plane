import type { ReactNode } from "react";

interface AuthFormHeaderProps {
  icon: ReactNode;
  iconColor?: "blue" | "green";
  title: string;
  subtitle: string;
}

const iconBgColors = {
  blue: "bg-blue-100",
  green: "bg-green-100",
};

const iconColors = {
  blue: "text-blue-600",
  green: "text-green-600",
};

export function AuthFormHeader({
  icon,
  iconColor = "blue",
  title,
  subtitle,
}: AuthFormHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
          iconBgColors[iconColor]
        } mx-auto`}
      >
        <div className={iconColors[iconColor]}>{icon}</div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 text-sm">{subtitle}</p>
    </div>
  );
}
