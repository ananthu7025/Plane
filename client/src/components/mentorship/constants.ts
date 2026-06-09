import type { MentorshipTopic, MentorshipStatus } from "@/types/mentorship";

export const TOPIC_LABELS: Record<MentorshipTopic, string> = {
  AIR_NAVIGATION:         "Air Navigation",
  FLIGHT_PLANNING:        "Flight Planning",
  METEOROLOGY:            "Meteorology",
  AIRCRAFT_SYSTEMS:       "Aircraft Systems",
  ATPL_PREPARATION:       "ATPL Preparation",
  CPL_PREPARATION:        "CPL Preparation",
  CAREER_GUIDANCE:        "Career Guidance",
  GENERAL_DOUBT_CLEARING: "General Doubt Clearing",
};

export const STATUS_LABELS: Record<MentorshipStatus, string> = {
  PENDING:     "Pending",
  APPROVED:    "Approved",
  REJECTED:    "Rejected",
  RESCHEDULED: "Rescheduled",
  COMPLETED:   "Completed",
  CANCELLED:   "Cancelled",
};

export const STATUS_BADGE_CLASSES: Record<MentorshipStatus, string> = {
  PENDING:     "bg-yellow-100 text-yellow-800",
  APPROVED:    "bg-green-100 text-green-800",
  REJECTED:    "bg-red-100 text-red-800",
  RESCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED:   "bg-gray-100 text-gray-700",
  CANCELLED:   "bg-gray-100 text-gray-500",
};

export const TOPIC_OPTIONS = Object.entries(TOPIC_LABELS).map(([value, label]) => ({
  value: value as MentorshipTopic,
  label,
}));
