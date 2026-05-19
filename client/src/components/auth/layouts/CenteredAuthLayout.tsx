import { type ReactNode } from "react";

interface CenteredAuthLayoutProps {
  children: ReactNode;
  maxWidth?: string;
}

export function CenteredAuthLayout({
  children,
  maxWidth = "max-w-md",
}: CenteredAuthLayoutProps) {
  return <div className={`w-full ${maxWidth} space-y-8`}>{children}</div>;
}
