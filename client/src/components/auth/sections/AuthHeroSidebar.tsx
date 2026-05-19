import { AUTH_HERO_HIGHLIGHTS, AUTH_TESTIMONIAL } from "../constants";
import { AuthLogoHeader } from "./AuthLogoHeader";

interface AuthHeroSidebarProps {
  headlineText?: string;
  description?: string;
}

export function AuthHeroSidebar({
  headlineText = "Your Journey to the\nCockpit Starts Here.",
  description = "India's most trusted aviation training platform. Master DGCA theory exams with expert guidance, real-world practice, and a community that lifts you higher.",
}: AuthHeroSidebarProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-indigo-900/40" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
        <AuthLogoHeader variant="desktop" />
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              {headlineText.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              <span className="block text-blue-300">
                {headlineText.includes("\n") ? "" : "Cockpit Starts Here."}
              </span>
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              {description}
            </p>
          </div>
          <div className="space-y-4">
            {AUTH_HERO_HIGHLIGHTS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 flex-shrink-0">
                  <item.icon className="w-4 h-4 text-blue-200" />
                </div>
                <span className="text-sm text-white/85">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
          <p className="text-sm text-white/80 italic leading-relaxed">
            "{AUTH_TESTIMONIAL.text}"
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-300/30 flex items-center justify-center text-xs font-bold text-white">
              {AUTH_TESTIMONIAL.initials}
            </div>
            <div>
              <p className="text-sm font-medium">{AUTH_TESTIMONIAL.author}</p>
              <p className="text-xs text-white/60">{AUTH_TESTIMONIAL.title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
