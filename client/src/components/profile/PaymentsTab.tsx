import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <CreditCard className="w-12 h-12 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">Payment history coming soon</p>
          <p className="text-sm text-muted-foreground/70">
            Your transactions will appear here once billing is enabled.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
