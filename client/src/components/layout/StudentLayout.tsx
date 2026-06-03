import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell, Search, Menu } from "lucide-react";
import { StudentSidebar } from "./StudentSidebar";
import { NotificationPanel } from "./NotificationPanel";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/hooks/redux";
import { ROUTES } from "@/lib/constants";

export function StudentLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const ownProfile = useAppSelector((state) => state.userManagement.ownProfile);

  const displayName = ownProfile?.fullName || user?.fullName || "User";
  const displayRole = ownProfile?.role || user?.role || "Student";
  const avatarSrc = ownProfile?.avatarMediaId
    ? `/api/media/${ownProfile.avatarMediaId}`
    : undefined;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <StudentSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-[280px] z-50 md:hidden"
            >
              <StudentSidebar
                collapsed={false}
                onToggle={() => setMobileSidebarOpen(false)}
                isMobileOverlay
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.main
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="min-h-screen"
      >
        <header className="sticky top-0 z-40 h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses, tests..."
                className="w-48 lg:w-64 pl-10 pr-4 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <NotificationPanel
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
              />
            </div>

            <button
              className="flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-1 hover:bg-muted/60 transition-colors"
              onClick={() => navigate(ROUTES.STUDENT_DASHBOARD + "/profile")}
            >
              <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayRole}</p>
              </div>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
