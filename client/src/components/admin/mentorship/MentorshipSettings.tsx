import { useEffect, useState } from "react";
import { IndianRupee, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMentorship } from "@/hooks/useMentorship";

export function MentorshipSettings() {
  const { settings, loadSettings, saveSettings } = useMentorship();
  const [feeRupees, setFeeRupees] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setFeeRupees(String(settings.sessionFeePaise / 100));
    }
  }, [settings]);

  async function handleSave() {
    const rupees = parseFloat(feeRupees);
    if (isNaN(rupees) || rupees < 1) return;
    setSaving(true);
    await saveSettings(Math.round(rupees * 100));
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6 max-w-md space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Session Fee</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          This fee is charged to students per 1-hour mentorship session via Razorpay.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Fee (₹)</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="number"
            min="1"
            step="1"
            value={feeRupees}
            onChange={(e) => setFeeRupees(e.target.value)}
            className="pl-8"
            placeholder="1999"
          />
        </div>
        {settings && (
          <p className="text-xs text-gray-400">Current: {settings.sessionFeeFormatted}</p>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving || !feeRupees}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Fee"}
      </Button>
    </div>
  );
}
