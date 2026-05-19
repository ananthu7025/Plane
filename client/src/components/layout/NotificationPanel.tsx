import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  X,
  Check,
  BookOpen,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard,
  Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  type:
    | "mcq"
    | "mentorship"
    | "course"
    | "community"
    | "newsletter"
    | "payment"
    | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}

const initialNotifications: Notification[] = [
  {
    id: "2",
    type: "mcq",
    title: "New Mock Test Available",
    message: "Air Navigation mock test #5 is now available",
    time: "1 hour ago",
    read: false,
    link: "/student/mcq",
  },
  {
    id: "3",
    type: "community",
    title: "Reply to your post",
    message: "Dr. Sarah Chen replied to your question",
    time: "3 hours ago",
    read: false,
    link: "/student/community",
  },
  {
    id: "4",
    type: "newsletter",
    title: "New Newsletter",
    message: "December Aviation Digest is now available",
    time: "5 hours ago",
    read: true,
    link: "/student/newsletters",
  },
  {
    id: "5",
    type: "course",
    title: "Course Update",
    message: "New lesson added to Air Navigation course",
    time: "1 day ago",
    read: true,
    link: "/student/courses",
  },
  {
    id: "6",
    type: "payment",
    title: "Payment Successful",
    message: "₹12,999 paid for Meteorology Course",
    time: "2 days ago",
    read: true,
    link: "/student/profile",
  },
];

const iconMap = {
  mcq: BookOpen,
  mentorship: Users,
  course: Calendar,
  community: MessageSquare,
  newsletter: FileText,
  payment: CreditCard,
  system: Bell,
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const deleteNotification = (id: string) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id);
    navigate(notif.link);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={markAllRead}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => {
                    const Icon = iconMap[notif.type];
                    return (
                      <div
                        key={notif.id}
                        className={`p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer group ${!notif.read ? "bg-primary/5" : ""}`}
                        onClick={() => handleClick(notif)}
                      >
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${!notif.read ? "bg-primary/10" : "bg-muted"}`}
                        >
                          <Icon
                            className={`w-4 h-4 ${!notif.read ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-medium truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {notif.time}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-destructive"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All Notifications
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
