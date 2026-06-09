import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOPIC_OPTIONS } from "./constants";
import type { SubmitMentorshipInput } from "@/types/mentorship";

const scheduleFormSchema = z.object({
  topic:         z.string().min(1, "Please select a topic"),
  description:   z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  preferredDate: z.string().min(1, "Please select a date"),
  preferredTime: z.string().min(1, "Please select a time"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleMeetingFormProps {
  onSubmit: (input: SubmitMentorshipInput) => Promise<boolean>;
  submitting: boolean;
  onCancel?: () => void;
}

export function ScheduleMeetingForm({
  onSubmit,
  submitting,
  onCancel,
}: ScheduleMeetingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormValues>({ resolver: zodResolver(scheduleFormSchema) });

  async function handleFormSubmit(values: ScheduleFormValues) {
    const preferredDateTime = new Date(
      `${values.preferredDate}T${values.preferredTime}`
    ).toISOString();

    const success = await onSubmit({
      topic:             values.topic as SubmitMentorshipInput["topic"],
      description:       values.description,
      preferredDateTime,
    });

    if (success) reset();
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Topic */}
      <div className="space-y-1.5">
        <Label>Topic</Label>
        <Select onValueChange={(v) => setValue("topic", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {TOPIC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.topic && (
          <p className="text-sm text-red-500">{errors.topic.message}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Preferred Date</Label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            {...register("preferredDate")}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.preferredDate && (
            <p className="text-sm text-red-500">{errors.preferredDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Preferred Time</Label>
          <input
            type="time"
            {...register("preferredTime")}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.preferredTime && (
            <p className="text-sm text-red-500">{errors.preferredTime.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          {...register("description")}
          placeholder="Describe your questions, doubts, or topics you want to discuss..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
