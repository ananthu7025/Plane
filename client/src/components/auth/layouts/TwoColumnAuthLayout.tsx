import { type ReactNode } from "react";
import { AuthHeroSidebar } from "../sections/AuthHeroSidebar";

interface TwoColumnAuthLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function TwoColumnAuthLayout({
  children,
  showSidebar = true,
}: TwoColumnAuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {showSidebar && <AuthHeroSidebar />}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white">
        {children}
      </div>
    </div>
  );
}
