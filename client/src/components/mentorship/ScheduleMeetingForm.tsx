import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, CreditCard, CheckCircle, Loader2 } from "lucide-react";
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
import { useMentorship } from "@/hooks/useMentorship";
import { useAppSelector } from "@/hooks/redux";
import type { MentorshipTopic, AvailableSlot } from "@/types/mentorship";

const formSchema = z.object({
  topic:       z.string().min(1, "Please select a topic"),
  description: z.string().min(20, "At least 20 characters").max(1000, "Max 1000 characters"),
  date:        z.string().min(1, "Please select a date"),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleMeetingFormProps {
  onSuccess: () => void;
  onCancel:  () => void;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export function ScheduleMeetingForm({ onSuccess, onCancel }: ScheduleMeetingFormProps) {
  const { availableSlots, slotsLoading, settings, loadSlots, getOrder, bookSession, submitting } = useMentorship();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const selectedDate = watch("date");

  useEffect(() => {
    if (selectedDate) {
      setSelectedSlot(null);
      loadSlots(selectedDate);
    }
  }, [selectedDate, loadSlots]);

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleFormSubmit(values: FormValues) {
    if (!selectedSlot) return;
    if (!settings) return;

    setPaymentLoading(true);
    const slotDateTime = `${values.date}T${selectedSlot.startTime}:00`;

    try {
      await loadRazorpayScript();

      const order = await getOrder();
      if (!order) {
        setPaymentLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        "PlaneAndProp",
        description: "Mentorship Session – 1 Hour",
        order_id:    order.orderId,
        prefill: {
          name:  currentUser?.fullName ?? "",
          email: currentUser?.email    ?? "",
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const ok = await bookSession({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            topic:             values.topic as MentorshipTopic,
            description:       values.description,
            slotDateTime,
            amountPaidPaise:   order.amount,
          });
          if (ok) {
            setBooked(true);
            reset();
            setTimeout(() => { setBooked(false); onSuccess(); }, 2500);
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => { setPaymentLoading(false); },
        },
        theme: { color: "#3b82f6" },
      });

      rzp.open();
    } catch {
      setPaymentLoading(false);
    }
  }

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Session Booked!</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Your session request has been sent for admin approval. You'll be notified once approved.
        </p>
      </div>
    );
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
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.topic && <p className="text-sm text-red-500">{errors.topic.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>Select Date</Label>
        <input
          type="date"
          min={todayStr}
          {...register("date")}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="space-y-2">
          <Label>Available Time Slots</Label>
          {slotsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading slots...
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No slots available for this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {availableSlots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors
                    ${!slot.available
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                      : selectedSlot?.startTime === slot.startTime
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                >
                  <Clock className="mx-auto mb-0.5 h-3.5 w-3.5 opacity-60" />
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
          {selectedSlot && (
            <p className="text-xs text-gray-500">
              Duration: <span className="font-medium">{selectedSlot.startTime} – {selectedSlot.endTime}</span> (1 hour)
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          {...register("description")}
          placeholder="Describe your questions, doubts, or discussion topics..."
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Session Fee */}
      {settings && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Session Fee</p>
            <p className="text-xs text-blue-600">1 hour one-on-one mentorship</p>
          </div>
          <p className="text-xl font-bold text-blue-900">{settings.sessionFeeFormatted}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={paymentLoading || submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!selectedSlot || paymentLoading || submitting}
        >
          {paymentLoading || submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
          ) : (
            <><CreditCard className="h-4 w-4 mr-2" /> Pay & Book</>
          )}
        </Button>
      </div>
    </form>
  );
}
