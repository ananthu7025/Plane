/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, LogOut, ChevronLeft, Plane, BookOpen, FileText, User, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { signOut } from "@/store/slices/authSlice";

interface StudentSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOverlay?: boolean;
}

const navItems = [
  { icon: MessageSquare, label: "Community", path: "/student/community" },
  { icon: BookOpen, label: "Blogs", path: "/student/blogs" },
  { icon: FileText, label: "Letters", path: "/student/letters" },
  { icon: FileText, label: "Newsletters", path: "/student/newsletters" },
  { icon: User, label: "Profile", path: "/student/profile" },
  { icon: Star, label: "Feedback", path: "/student/feedback" },
];

export function StudentSidebar({
  collapsed,
  onToggle,
  isMobileOverlay,
}: StudentSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { refreshToken } = useAppSelector((state) => state.auth);

  const handleSignOut = async () => {
    if (refreshToken) {
      await dispatch(signOut(refreshToken) as any);
    }
    navigate("/login");
  };

  const effectiveCollapsed = isMobileOverlay ? false : collapsed;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobileOverlay ? 280 : collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "h-screen sidebar-gradient flex flex-col",
        isMobileOverlay ? "w-[280px]" : "fixed left-0 top-0 z-50",
      )}
    >
      <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Plane className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        {!effectiveCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <h1 className="font-display font-bold text-sidebar-foreground text-lg whitespace-nowrap">
              Plane & Prop
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Student Portal</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobileOverlay ? onToggle : undefined}
              className={cn("nav-link", isActive && "active")}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!effectiveCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-sidebar-border">
        <button
          className="nav-link w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!effectiveCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {!isMobileOverlay && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-4 top-8 w-8 h-8 rounded-full bg-card border border-border shadow-md text-foreground hover:bg-muted hidden md:flex"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </Button>
      )}
    </motion.aside>
  );
}
