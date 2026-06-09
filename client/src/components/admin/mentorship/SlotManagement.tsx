import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMentorship } from "@/hooks/useMentorship";
import type { SlotTemplate } from "@/types/mentorship";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMES: string[] = [];
for (let h = 6; h <= 21; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

function groupByDay(templates: SlotTemplate[]): Record<number, SlotTemplate[]> {
  const grouped: Record<number, SlotTemplate[]> = {};
  for (let i = 0; i < 7; i++) grouped[i] = [];
  for (const t of templates) {
    grouped[t.dayOfWeek] = grouped[t.dayOfWeek] ?? [];
    grouped[t.dayOfWeek].push(t);
  }
  for (const key in grouped) {
    grouped[Number(key)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return grouped;
}

export function SlotManagement() {
  const {
    slotTemplates,
    loadSlotTemplates,
    addSlot,
    removeSlot,
    toggleSlot,
    copySlots,
  } = useMentorship();

  const [newDay, setNewDay]   = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");
  const [adding, setAdding]   = useState(false);

  // Copy UI
  const [copyFrom,  setCopyFrom]  = useState<string>("");
  const [copyTo,    setCopyTo]    = useState<number[]>([]);
  const [copying,   setCopying]   = useState(false);

  useEffect(() => { loadSlotTemplates(); }, [loadSlotTemplates]);

  const grouped = groupByDay(slotTemplates);

  async function handleAdd() {
    if (!newDay || !newTime) return;
    setAdding(true);
    await addSlot(parseInt(newDay), newTime);
    setNewDay(""); setNewTime("");
    setAdding(false);
  }

  async function handleCopy() {
    if (!copyFrom || copyTo.length === 0) return;
    setCopying(true);
    await copySlots(parseInt(copyFrom), copyTo);
    setCopyTo([]);
    setCopying(false);
  }

  function toggleCopyTo(day: number) {
    setCopyTo((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Slot */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="text-base font-semibold mb-4">Add New Slot</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 w-44">
            <Label>Day of Week</Label>
            <Select value={newDay} onValueChange={setNewDay}>
              <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-36">
            <Label>Start Time</Label>
            <Select value={newTime} onValueChange={setNewTime}>
              <SelectTrigger><SelectValue placeholder="HH:MM" /></SelectTrigger>
              <SelectContent>
                {TIMES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!newDay || !newTime || adding}>
            <Plus className="h-4 w-4 mr-1" />
            Add Slot
          </Button>
        </div>
      </div>

      {/* Copy Slots */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="text-base font-semibold mb-4">Copy Slots</h3>
        <p className="text-sm text-gray-500 mb-3">Copy all slots from one day to selected days.</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 w-44">
            <Label>Copy From</Label>
            <Select value={copyFrom} onValueChange={setCopyFrom}>
              <SelectTrigger><SelectValue placeholder="Source day" /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Copy To</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={copyFrom === String(i)}
                  onClick={() => toggleCopyTo(i)}
                  className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors
                    ${copyTo.includes(i)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleCopy}
            disabled={!copyFrom || copyTo.length === 0 || copying}
            variant="outline"
          >
            <Copy className="h-4 w-4 mr-1" />
            {copying ? "Copying..." : "Copy Slots"}
          </Button>
        </div>
      </div>

      {/* Slots by Day */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map((day, dayIdx) => (
          <div key={dayIdx} className="bg-white rounded-xl border p-4">
            <h4 className="font-medium text-gray-900 mb-3">{day}</h4>
            {grouped[dayIdx].length === 0 ? (
              <p className="text-xs text-gray-400">No slots configured</p>
            ) : (
              <ul className="space-y-1.5">
                {grouped[dayIdx].map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-mono ${t.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>
                      {t.startTime}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={t.isActive ? "Disable slot" : "Enable slot"}
                        onClick={() => toggleSlot(t.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {t.isActive
                          ? <ToggleRight className="h-4 w-4 text-green-600" />
                          : <ToggleLeft  className="h-4 w-4 text-gray-400" />
                        }
                      </button>
                      <button
                        type="button"
                        title="Delete slot"
                        onClick={() => removeSlot(t.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
