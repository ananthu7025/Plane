import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Bell className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">Notifications coming soon</p>
          <p className="text-sm text-muted-foreground/70">
            You'll be able to manage your notification preferences here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
