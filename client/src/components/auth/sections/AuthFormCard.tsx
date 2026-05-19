import type { ReactNode } from "react";

interface AuthFormCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthFormCard({ children, className = "" }: AuthFormCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
}
