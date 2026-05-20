import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  MessageSquare,
  Shield,
  Plane,
  Settings,
  ChevronLeft,
  LogOut,
  FileCheck,
} from "lucide-react";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOverlay?: boolean;
}

const navGroups = [
  {
    label: "User Management",
    items: [
      { icon: Users, label: "Students", path: "/admin/students" },
      { icon: Shield, label: "Roles & Access", path: "/admin/roles" },
    ],
  },
  {
    label: "Community",
    items: [
      { icon: MessageSquare, label: "Community", path: "/admin/community" },
    ],
  },
  {
    label: "Moderation",
    items: [
      { icon: FileCheck, label: "Letters", path: "/admin/letters" },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  onToggle,
  isMobileOverlay,
}: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/admin/login");
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
            <p className="text-xs text-sidebar-foreground/60">Admin Console</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!effectiveCollapsed && (
              <p className="px-4 mb-2 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 sm:p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/admin/settings"
          onClick={isMobileOverlay ? onToggle : undefined}
          className={cn(
            "nav-link",
            location.pathname === "/admin/settings" && "active",
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!effectiveCollapsed && <span>Settings</span>}
        </NavLink>
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
