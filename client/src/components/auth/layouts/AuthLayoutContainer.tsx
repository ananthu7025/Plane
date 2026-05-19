import { type ReactNode } from "react";

interface AuthLayoutContainerProps {
  children: ReactNode;
  bgGradientClass?: string;
}

export function AuthLayoutContainer({
  children,
  bgGradientClass = "from-blue-50 via-white to-indigo-50",
}: AuthLayoutContainerProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${bgGradientClass} p-4`}>
      {children}
    </div>
  );
}
