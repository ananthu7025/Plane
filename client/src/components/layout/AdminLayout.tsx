import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell, Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <AdminSidebar
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
              <AdminSidebar
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
                placeholder="Search users, content..."
                className="w-48 lg:w-72 pl-10 pr-4 py-2 rounded-xl border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 sm:h-9 sm:w-9"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>

            <div className="flex items-center gap-2 sm:gap-3 sm:pl-3 sm:border-l border-border">
              <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
                <AvatarFallback>
                  {(user?.fullName || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">
                  {user?.fullName || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || "Administrator"}
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
