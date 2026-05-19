import { Plane } from "lucide-react";

interface AuthLogoHeaderProps {
  variant?: "desktop" | "mobile" | "both";
  className?: string;
}

export function AuthLogoHeader({
  variant = "both",
}: AuthLogoHeaderProps) {
  const desktopLogo = (
    <div className="hidden lg:flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/25 transition-colors">
        <Plane className="w-6 h-6" />
      </div>
      <span className="text-xl font-bold tracking-tight text-white">
        Plane & Prop
      </span>
    </div>
  );

  const mobileLogo = (
    <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
      <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
        <Plane className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-bold text-gray-900">Plane & Prop</span>
    </div>
  );

  if (variant === "desktop") return desktopLogo;
  if (variant === "mobile") return mobileLogo;

  return (
    <>
      {desktopLogo}
      {mobileLogo}
    </>
  );
}
