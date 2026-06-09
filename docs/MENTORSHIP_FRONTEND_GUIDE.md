# Mentorship Module — Frontend Implementation Guide

**PlaneAndProp Frontend** • React 19 + Redux Toolkit + TypeScript + Tailwind CSS

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Step 1 — Types](#step-1--types)
4. [Step 2 — Redux Slice](#step-2--redux-slice)
5. [Step 3 — Register Slice in Store](#step-3--register-slice-in-store)
6. [Step 4 — Custom Hook](#step-4--custom-hook)
7. [Step 5 — Constants](#step-5--constants)
8. [Step 6 — Components](#step-6--components)
9. [Step 7 — Pages](#step-7--pages)
10. [Step 8 — Add Routes](#step-8--add-routes)
11. [Step 9 — Add Sidebar Nav Items](#step-9--add-sidebar-nav-items)
12. [UI Behaviour Reference](#ui-behaviour-reference)
13. [Implementation Checklist](#implementation-checklist)

---

## Overview

The mentorship module has two surfaces:

| Surface | Path | Who |
|---------|------|-----|
| Student page | `/student/mentorship` | Submit requests, view status, join meetings |
| Admin page | `/admin/mentorship` | Review, approve, reject, reschedule |

**Data flow (same pattern as every other module):**

```
Page component
    ↓ dispatch thunk
Redux Thunk → axiosInstance → Backend API
    ↓ response.data.data
Redux slice (extraReducers)
    ↓
useAppSelector
    ↓
Component re-renders
```

**Standards followed:**
- All data lives in Redux — no `useState` for server data
- `axiosInstance` from `@/api/client` for all API calls
- `normalizeError` from `@/lib/errorHandler` in all rejected cases
- `useAppDispatch` / `useAppSelector` from `@/hooks/redux` (typed versions)
- No `as any` casts anywhere
- Zod for form validation with `react-hook-form`

---

## File Structure

Create the following files:

```
client/src/
├── types/
│   └── mentorship.ts
├── store/slices/
│   └── mentorshipSlice.ts
├── hooks/
│   └── useMentorship.ts
├── components/
│   ├── mentorship/
│   │   ├── index.ts
│   │   ├── constants.ts
│   │   ├── MentorshipStatusBadge.tsx
│   │   ├── MentorshipStatsBar.tsx
│   │   ├── MeetingCard.tsx
│   │   └── ScheduleMeetingForm.tsx
│   └── admin/
│       └── mentorship/
│           ├── index.ts
│           ├── MentorshipRequestsTable.tsx
│           └── RequestActionModal.tsx
└── pages/
    ├── student/
    │   └── StudentMentorship.tsx
    └── admin/
        └── AdminMentorship.tsx
```

---

## Step 1 — Types

Create **`client/src/types/mentorship.ts`**:

```typescript
export type MentorshipTopic =
  | "AIR_NAVIGATION"
  | "FLIGHT_PLANNING"
  | "METEOROLOGY"
  | "AIRCRAFT_SYSTEMS"
  | "ATPL_PREPARATION"
  | "CPL_PREPARATION"
  | "CAREER_GUIDANCE"
  | "GENERAL_DOUBT_CLEARING";

export type MentorshipStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  reviewedBy: string | null;
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: string; // ISO string from API
  status: MentorshipStatus;
  rejectionReason: string | null;
  rescheduledDateTime: string | null;
  teamsJoinUrl: string | null;
  meetingStartDateTime: string | null;
  meetingEndDateTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
}

export interface SubmitMentorshipInput {
  topic: MentorshipTopic;
  description: string;
  preferredDateTime: string; // ISO 8601
}

export interface ApproveMentorshipInput {
  scheduledDateTime?: string;
}

export interface RejectMentorshipInput {
  reason: string;
}

export interface RescheduleMentorshipInput {
  rescheduledDateTime: string;
}

export interface AdminMentorshipFilters {
  page?: number;
  limit?: number;
  status?: MentorshipStatus | "all";
  search?: string;
}
```

---

## Step 2 — Redux Slice

Create **`client/src/store/slices/mentorshipSlice.ts`**:

```typescript
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";
import { normalizeError } from "@/lib/errorHandler";
import type {
  MentorshipRequest,
  MentorshipStats,
  SubmitMentorshipInput,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  AdminMentorshipFilters,
} from "@/types/mentorship";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchMyMentorshipRequests = createAsyncThunk(
  "mentorship/fetchMy",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/mentorship/my");
      return response.data.data as { requests: MentorshipRequest[]; stats: MentorshipStats };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const submitMentorshipRequest = createAsyncThunk(
  "mentorship/submit",
  async (input: SubmitMentorshipInput, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/mentorship", input);
      return response.data.data.request as MentorshipRequest;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchAdminMentorshipRequests = createAsyncThunk(
  "mentorship/fetchAdmin",
  async (filters: AdminMentorshipFilters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/mentorship/admin", { params: filters });
      return response.data.data as {
        requests: MentorshipRequest[];
        stats: MentorshipStats;
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const approveMentorshipRequest = createAsyncThunk(
  "mentorship/approve",
  async (
    { id, input }: { id: string; input: ApproveMentorshipInput },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.patch(`/mentorship/admin/${id}/approve`, input);
      return response.data.data.request as MentorshipRequest;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const rejectMentorshipRequest = createAsyncThunk(
  "mentorship/reject",
  async (
    { id, input }: { id: string; input: RejectMentorshipInput },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.patch(`/mentorship/admin/${id}/reject`, input);
      return response.data.data.request as MentorshipRequest;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const rescheduleMentorshipRequest = createAsyncThunk(
  "mentorship/reschedule",
  async (
    { id, input }: { id: string; input: RescheduleMentorshipInput },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.patch(`/mentorship/admin/${id}/reschedule`, input);
      return response.data.data.request as MentorshipRequest;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// ── State ─────────────────────────────────────────────────────────────────────

interface MentorshipState {
  // Student view
  myRequests: MentorshipRequest[];
  myStats: MentorshipStats | null;
  // Admin view
  adminRequests: MentorshipRequest[];
  adminStats: MentorshipStats | null;
  adminPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  // Shared
  selectedRequest: MentorshipRequest | null;
  loading: boolean;
  submitting: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: MentorshipState = {
  myRequests:      [],
  myStats:         null,
  adminRequests:   [],
  adminStats:      null,
  adminPagination: null,
  selectedRequest: null,
  loading:         false,
  submitting:      false,
  actionLoading:   false,
  error:           null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const mentorshipSlice = createSlice({
  name: "mentorship",
  initialState,
  reducers: {
    setSelectedRequest(state, action: PayloadAction<MentorshipRequest | null>) {
      state.selectedRequest = action.payload;
    },
    clearMentorshipError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchMyMentorshipRequests
    builder
      .addCase(fetchMyMentorshipRequests.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchMyMentorshipRequests.fulfilled, (state, action) => {
        state.loading     = false;
        state.myRequests  = action.payload.requests;
        state.myStats     = action.payload.stats;
      })
      .addCase(fetchMyMentorshipRequests.rejected, (state, action) => {
        state.loading = false;
        state.error   = normalizeError(action.payload).userMessage;
      });

    // submitMentorshipRequest
    builder
      .addCase(submitMentorshipRequest.pending, (state) => {
        state.submitting = true;
        state.error      = null;
      })
      .addCase(submitMentorshipRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.myRequests.unshift(action.payload);
        if (state.myStats) {
          state.myStats.total   += 1;
          state.myStats.pending += 1;
        }
      })
      .addCase(submitMentorshipRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error      = normalizeError(action.payload).userMessage;
      });

    // fetchAdminMentorshipRequests
    builder
      .addCase(fetchAdminMentorshipRequests.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchAdminMentorshipRequests.fulfilled, (state, action) => {
        state.loading          = false;
        state.adminRequests    = action.payload.requests;
        state.adminStats       = action.payload.stats;
        state.adminPagination  = action.payload.pagination;
      })
      .addCase(fetchAdminMentorshipRequests.rejected, (state, action) => {
        state.loading = false;
        state.error   = normalizeError(action.payload).userMessage;
      });

    // Shared reducer for approve / reject / reschedule
    const handleActionFulfilled = (
      state: MentorshipState,
      updated: MentorshipRequest
    ) => {
      const idx = state.adminRequests.findIndex((r) => r.id === updated.id);
      if (idx !== -1) state.adminRequests[idx] = updated;
      if (state.selectedRequest?.id === updated.id) state.selectedRequest = updated;
      state.actionLoading = false;
    };

    builder
      .addCase(approveMentorshipRequest.pending, (state) => {
        state.actionLoading = true;
        state.error         = null;
      })
      .addCase(approveMentorshipRequest.fulfilled, (state, action) => {
        handleActionFulfilled(state, action.payload);
      })
      .addCase(approveMentorshipRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.error         = normalizeError(action.payload).userMessage;
      });

    builder
      .addCase(rejectMentorshipRequest.pending, (state) => {
        state.actionLoading = true;
        state.error         = null;
      })
      .addCase(rejectMentorshipRequest.fulfilled, (state, action) => {
        handleActionFulfilled(state, action.payload);
      })
      .addCase(rejectMentorshipRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.error         = normalizeError(action.payload).userMessage;
      });

    builder
      .addCase(rescheduleMentorshipRequest.pending, (state) => {
        state.actionLoading = true;
        state.error         = null;
      })
      .addCase(rescheduleMentorshipRequest.fulfilled, (state, action) => {
        handleActionFulfilled(state, action.payload);
      })
      .addCase(rescheduleMentorshipRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.error         = normalizeError(action.payload).userMessage;
      });
  },
});

export const { setSelectedRequest, clearMentorshipError } = mentorshipSlice.actions;
export default mentorshipSlice.reducer;
```

---

## Step 3 — Register Slice in Store

In **`client/src/store/index.ts`**, add the mentorship reducer alongside the existing ones:

```typescript
import mentorshipReducer from "./slices/mentorshipSlice";

export const store = configureStore({
  reducer: {
    // ... existing reducers
    mentorship: mentorshipReducer,
  },
  // ... rest of config unchanged
});
```

---

## Step 4 — Custom Hook

Create **`client/src/hooks/useMentorship.ts`**:

```typescript
import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchMyMentorshipRequests,
  submitMentorshipRequest,
  fetchAdminMentorshipRequests,
  approveMentorshipRequest,
  rejectMentorshipRequest,
  rescheduleMentorshipRequest,
  setSelectedRequest,
  clearMentorshipError,
} from "@/store/slices/mentorshipSlice";
import type {
  MentorshipRequest,
  SubmitMentorshipInput,
  ApproveMentorshipInput,
  RejectMentorshipInput,
  RescheduleMentorshipInput,
  AdminMentorshipFilters,
} from "@/types/mentorship";

export function useMentorship() {
  const dispatch = useAppDispatch();
  const state    = useAppSelector((s) => s.mentorship);

  const loadMyRequests = useCallback(() => {
    dispatch(fetchMyMentorshipRequests());
  }, [dispatch]);

  const submitRequest = useCallback(
    async (input: SubmitMentorshipInput): Promise<boolean> => {
      const result = await dispatch(submitMentorshipRequest(input));
      if (submitMentorshipRequest.fulfilled.match(result)) {
        toast.success("Mentorship request submitted successfully");
        return true;
      }
      toast.error(state.error ?? "Failed to submit request");
      return false;
    },
    [dispatch, state.error]
  );

  const loadAdminRequests = useCallback(
    (filters: AdminMentorshipFilters = {}) => {
      dispatch(fetchAdminMentorshipRequests(filters));
    },
    [dispatch]
  );

  const approve = useCallback(
    async (id: string, input: ApproveMentorshipInput = {}): Promise<boolean> => {
      const result = await dispatch(approveMentorshipRequest({ id, input }));
      if (approveMentorshipRequest.fulfilled.match(result)) {
        toast.success("Request approved — Teams meeting created");
        return true;
      }
      toast.error(state.error ?? "Failed to approve request");
      return false;
    },
    [dispatch, state.error]
  );

  const reject = useCallback(
    async (id: string, input: RejectMentorshipInput): Promise<boolean> => {
      const result = await dispatch(rejectMentorshipRequest({ id, input }));
      if (rejectMentorshipRequest.fulfilled.match(result)) {
        toast.success("Request rejected");
        return true;
      }
      toast.error(state.error ?? "Failed to reject request");
      return false;
    },
    [dispatch, state.error]
  );

  const reschedule = useCallback(
    async (id: string, input: RescheduleMentorshipInput): Promise<boolean> => {
      const result = await dispatch(rescheduleMentorshipRequest({ id, input }));
      if (rescheduleMentorshipRequest.fulfilled.match(result)) {
        toast.success("Request rescheduled");
        return true;
      }
      toast.error(state.error ?? "Failed to reschedule request");
      return false;
    },
    [dispatch, state.error]
  );

  const selectRequest = useCallback(
    (request: MentorshipRequest | null) => {
      dispatch(setSelectedRequest(request));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearMentorshipError());
  }, [dispatch]);

  return {
    // State
    myRequests:      state.myRequests,
    myStats:         state.myStats,
    adminRequests:   state.adminRequests,
    adminStats:      state.adminStats,
    adminPagination: state.adminPagination,
    selectedRequest: state.selectedRequest,
    loading:         state.loading,
    submitting:      state.submitting,
    actionLoading:   state.actionLoading,
    error:           state.error,
    // Actions
    loadMyRequests,
    submitRequest,
    loadAdminRequests,
    approve,
    reject,
    reschedule,
    selectRequest,
    clearError,
  };
}
```

---

## Step 5 — Constants

Create **`client/src/components/mentorship/constants.ts`**:

```typescript
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
```

---

## Step 6 — Components

### `MentorshipStatusBadge.tsx`

```typescript
import type { MentorshipStatus } from "@/types/mentorship";
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "./constants";

interface MentorshipStatusBadgeProps {
  status: MentorshipStatus;
}

export function MentorshipStatusBadge({ status }: MentorshipStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
```

---

### `MentorshipStatsBar.tsx`

```typescript
import { Calendar, CheckCircle, Clock, Trophy } from "lucide-react";
import type { MentorshipStats } from "@/types/mentorship";

interface MentorshipStatsBarProps {
  stats: MentorshipStats;
}

export function MentorshipStatsBar({ stats }: MentorshipStatsBarProps) {
  const cards = [
    { label: "Total",     value: stats.total,     icon: Calendar,    color: "text-blue-600"   },
    { label: "Pending",   value: stats.pending,   icon: Clock,       color: "text-yellow-600" },
    { label: "Approved",  value: stats.approved,  icon: CheckCircle, color: "text-green-600"  },
    { label: "Completed", value: stats.completed, icon: Trophy,      color: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### `MeetingCard.tsx`

```typescript
import { ExternalLink, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentorshipStatusBadge } from "./MentorshipStatusBadge";
import { TOPIC_LABELS } from "./constants";
import type { MentorshipRequest } from "@/types/mentorship";

interface MeetingCardProps {
  request: MentorshipRequest;
}

/**
 * Displays a single mentorship request card with topic, date, status, and join button
 */
export function MeetingCard({ request }: MeetingCardProps) {
  const displayDate = new Date(
    request.meetingStartDateTime ??
    request.rescheduledDateTime ??
    request.preferredDateTime
  );

  const canJoin = request.status === "APPROVED" && !!request.teamsJoinUrl;

  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900">{TOPIC_LABELS[request.topic]}</h3>
        <MentorshipStatusBadge status={request.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {displayDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {displayDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {request.status === "REJECTED" && request.rejectionReason && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {request.rejectionReason}
        </p>
      )}

      {canJoin && (
        <a href={request.teamsJoinUrl!} target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Join Teams Meeting
          </Button>
        </a>
      )}
    </div>
  );
}
```

---

### `ScheduleMeetingForm.tsx`

```typescript
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
  topic: z.string().min(1, "Please select a topic"),
  description: z
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

/**
 * Form for students to submit a new mentorship session request
 */
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
```

---

### `MentorshipRequestsTable.tsx` (Admin)

```typescript
import { Button } from "@/components/ui/button";
import { MentorshipStatusBadge } from "@/components/mentorship/MentorshipStatusBadge";
import { TOPIC_LABELS } from "@/components/mentorship/constants";
import type { MentorshipRequest } from "@/types/mentorship";

interface MentorshipRequestsTableProps {
  requests: MentorshipRequest[];
  onSelect: (request: MentorshipRequest) => void;
}

export function MentorshipRequestsTable({
  requests,
  onSelect,
}: MentorshipRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No mentorship requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-3 font-medium">Student</th>
            <th className="pb-3 font-medium">Topic</th>
            <th className="pb-3 font-medium">Preferred Date</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests.map((request) => {
            const displayDate = new Date(request.preferredDateTime);
            return (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="py-3">
                  <p className="font-medium text-gray-900">
                    {request.studentName ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">{request.studentEmail}</p>
                </td>
                <td className="py-3">{TOPIC_LABELS[request.topic]}</td>
                <td className="py-3 text-gray-600">
                  {displayDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  {displayDate.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3">
                  <MentorshipStatusBadge status={request.status} />
                </td>
                <td className="py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelect(request)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

### `RequestActionModal.tsx` (Admin)

```typescript
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MentorshipStatusBadge } from "@/components/mentorship/MentorshipStatusBadge";
import { TOPIC_LABELS } from "@/components/mentorship/constants";
import type { MentorshipRequest } from "@/types/mentorship";

type ActionMode = "idle" | "reject" | "reschedule";

interface RequestActionModalProps {
  request: MentorshipRequest | null;
  onClose: () => void;
  onApprove: (id: string, scheduledDateTime?: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
  onReschedule: (id: string, rescheduledDateTime: string) => Promise<boolean>;
  loading: boolean;
}

/**
 * Admin modal for reviewing, approving, rejecting, or rescheduling a request
 */
export function RequestActionModal({
  request,
  onClose,
  onApprove,
  onReject,
  onReschedule,
  loading,
}: RequestActionModalProps) {
  const [mode, setMode]                   = useState<ActionMode>("idle");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rescheduleDate, setRescheduleDate]   = useState("");
  const [rescheduleTime, setRescheduleTime]   = useState("");

  const canApprove =
    request?.status === "PENDING" || request?.status === "RESCHEDULED";

  function resetForm() {
    setMode("idle");
    setRejectionReason("");
    setRescheduleDate("");
    setRescheduleTime("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleApprove() {
    if (!request) return;
    const success = await onApprove(request.id);
    if (success) handleClose();
  }

  async function handleReject() {
    if (!request || !rejectionReason.trim()) return;
    const success = await onReject(request.id, rejectionReason);
    if (success) handleClose();
  }

  async function handleReschedule() {
    if (!request || !rescheduleDate || !rescheduleTime) return;
    const rescheduledDateTime = new Date(
      `${rescheduleDate}T${rescheduleTime}`
    ).toISOString();
    const success = await onReschedule(request.id, rescheduledDateTime);
    if (success) handleClose();
  }

  return (
    <Dialog open={!!request} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Mentorship Request</DialogTitle>
        </DialogHeader>

        {request && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">
                {request.studentName}
              </span>
              <MentorshipStatusBadge status={request.status} />
            </div>

            <div>
              <p className="text-gray-500">Topic</p>
              <p className="font-medium">{TOPIC_LABELS[request.topic]}</p>
            </div>

            <div>
              <p className="text-gray-500">Preferred Date & Time</p>
              <p className="font-medium">
                {new Date(request.preferredDateTime).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Description</p>
              <p className="text-gray-800 whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {mode === "reject" && (
              <div className="space-y-1.5">
                <Label>Rejection Reason</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={3}
                />
              </div>
            )}

            {mode === "reschedule" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>New Date</Label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>New Time</Label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === "idle" && canApprove && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode("reschedule")}
                disabled={loading}
              >
                Reschedule
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode("reject")}
                disabled={loading}
              >
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {loading ? "Approving..." : "Approve & Create Meeting"}
              </Button>
            </>
          )}

          {mode === "reject" && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode("idle")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
              >
                {loading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </>
          )}

          {mode === "reschedule" && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode("idle")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={loading || !rescheduleDate || !rescheduleTime}
              >
                {loading ? "Rescheduling..." : "Confirm Reschedule"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Step 7 — Pages

### `pages/student/StudentMentorship.tsx`

```typescript
import { useEffect, useState } from "react";
import { Plus, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMentorship } from "@/hooks/useMentorship";
import { MentorshipStatsBar } from "@/components/mentorship/MentorshipStatsBar";
import { MeetingCard } from "@/components/mentorship/MeetingCard";
import { ScheduleMeetingForm } from "@/components/mentorship/ScheduleMeetingForm";
import type { SubmitMentorshipInput } from "@/types/mentorship";

export default function StudentMentorship() {
  const {
    myRequests,
    myStats,
    loading,
    submitting,
    loadMyRequests,
    submitRequest,
  } = useMentorship();

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests]);

  const upcomingRequests = myRequests.filter(
    (r) => r.status === "APPROVED" || r.status === "RESCHEDULED"
  );

  async function handleSubmit(input: SubmitMentorshipInput) {
    const success = await submitRequest(input);
    if (success) setShowForm(false);
    return success;
  }

  if (loading && myRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule one-on-one sessions with your mentor via Microsoft Teams
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </div>

      {/* Stats */}
      {myStats && <MentorshipStatsBar stats={myStats} />}

      {/* Schedule form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Schedule New Meeting</h2>
          <ScheduleMeetingForm
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Upcoming meetings */}
      {upcomingRequests.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-green-600" />
            Upcoming Meetings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingRequests.map((r) => (
              <MeetingCard key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}

      {/* All requests */}
      <section>
        <h2 className="text-lg font-semibold mb-3">All Requests</h2>
        {myRequests.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
            You have not submitted any mentorship requests yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myRequests.map((r) => (
              <MeetingCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

---

### `pages/admin/AdminMentorship.tsx`

```typescript
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMentorship } from "@/hooks/useMentorship";
import { MentorshipStatsBar } from "@/components/mentorship/MentorshipStatsBar";
import { MentorshipRequestsTable } from "@/components/admin/mentorship/MentorshipRequestsTable";
import { RequestActionModal } from "@/components/admin/mentorship/RequestActionModal";
import type { AdminMentorshipFilters } from "@/types/mentorship";

export default function AdminMentorship() {
  const {
    adminRequests,
    adminStats,
    adminPagination,
    selectedRequest,
    loading,
    actionLoading,
    loadAdminRequests,
    approve,
    reject,
    reschedule,
    selectRequest,
  } = useMentorship();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);

  useEffect(() => {
    const filters: AdminMentorshipFilters = {
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      search: search || undefined,
      page,
    };
    loadAdminRequests(filters);
  }, [statusFilter, page]);

  function handleSearch() {
    setPage(1);
    loadAdminRequests({
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      search: search || undefined,
      page: 1,
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mentorship Requests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, reject, or reschedule student session requests
        </p>
      </div>

      {/* Stats */}
      {adminStats && <MentorshipStatsBar stats={adminStats} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-5">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <MentorshipRequestsTable
            requests={adminRequests}
            onSelect={selectRequest}
          />
        )}
      </div>

      {/* Pagination */}
      {adminPagination && adminPagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {adminRequests.length} of {adminPagination.total} requests
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= adminPagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action modal */}
      <RequestActionModal
        request={selectedRequest}
        onClose={() => selectRequest(null)}
        onApprove={(id, scheduledDateTime) =>
          approve(id, scheduledDateTime ? { scheduledDateTime } : {})
        }
        onReject={(id, reason) => reject(id, { reason })}
        onReschedule={(id, rescheduledDateTime) =>
          reschedule(id, { rescheduledDateTime })
        }
        loading={actionLoading}
      />
    </div>
  );
}
```

---

## Step 8 — Add Routes

### Add path constants

In **`client/src/lib/constants.ts`**, add to the `ROUTES` object:

```typescript
STUDENT_MENTORSHIP: "/student/mentorship",
ADMIN_MENTORSHIP:   "/admin/mentorship",
```

### Update routeConfig.tsx

In **`client/src/lib/routeConfig.tsx`**, add the imports and route entries:

```typescript
import StudentMentorship from "@/pages/student/StudentMentorship";
import AdminMentorship   from "@/pages/admin/AdminMentorship";

// Inside studentRoutes children array (alongside "feedback", "blogs", etc.):
{
  path: "mentorship",
  element: <StudentMentorship />,
},

// Inside adminRoutes children array (alongside "feedback", "blogs", etc.):
{
  path: "mentorship",
  element: <AdminMentorship />,
},
```

---

## Step 9 — Add Sidebar Nav Items

In **`StudentSidebar`**, add the mentorship nav item alongside the existing items:

```typescript
{ label: "Mentorship", path: "mentorship", icon: <Users className="h-4 w-4" /> }
```

In **`AdminSidebar`**, add:

```typescript
{ label: "Mentorship", path: "mentorship", icon: <CalendarCheck className="h-4 w-4" /> }
```

---

## UI Behaviour Reference

| Status | Student sees | Admin can do |
|--------|-------------|-------------|
| `PENDING` | "Awaiting review" card | Approve / Reject / Reschedule |
| `APPROVED` | Card with **Join Teams Meeting** button | — |
| `RESCHEDULED` | Updated date, no join button yet | Approve (creates meeting) / Reject |
| `REJECTED` | Red rejection reason banner | — |
| `COMPLETED` | Greyed-out card | — |

---

## Implementation Checklist

- [ ] Create `types/mentorship.ts`
- [ ] Create `store/slices/mentorshipSlice.ts`
- [ ] Register reducer in `store/index.ts`
- [ ] Create `hooks/useMentorship.ts`
- [ ] Create `components/mentorship/constants.ts`
- [ ] Create `components/mentorship/MentorshipStatusBadge.tsx`
- [ ] Create `components/mentorship/MentorshipStatsBar.tsx`
- [ ] Create `components/mentorship/MeetingCard.tsx`
- [ ] Create `components/mentorship/ScheduleMeetingForm.tsx`
- [ ] Create `components/admin/mentorship/MentorshipRequestsTable.tsx`
- [ ] Create `components/admin/mentorship/RequestActionModal.tsx`
- [ ] Create `pages/student/StudentMentorship.tsx`
- [ ] Create `pages/admin/AdminMentorship.tsx`
- [ ] Add route constants to `lib/constants.ts`
- [ ] Add routes to `lib/routeConfig.tsx`
- [ ] Add nav items to `StudentSidebar` and `AdminSidebar`

---

**Last Updated:** June 8, 2026
