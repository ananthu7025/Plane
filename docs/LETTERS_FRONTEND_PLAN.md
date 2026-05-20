# Letters Feature - Frontend Implementation Plan

**Status**: Design Ready (UI Components in C:\Users\Anathapadmanabhan\Desktop\UI)
**Last Updated**: May 20, 2026
**Framework**: React 18 + TypeScript + Redux Toolkit + Tailwind CSS

---

## Table of Contents

1. [Overview](#overview)
2. [Redux State Management](#redux-state-management)
3. [Pages & Components](#pages--components)
4. [Implementation Tasks](#implementation-tasks)
5. [State Persistence](#state-persistence)
6. [Error Handling](#error-handling)

---

## Overview

### Architecture Pattern

Following the established pattern from auth and community features:

```
Component → Redux Thunk → Axios API Call → Service Layer → Redux Reducer → UI Update
```

### Key Files to Create

```
client/src/
├── store/slices/
│   ├── letterSlice.ts              # Redux state + reducers
│   └── letterThunks.ts             # Async API thunks
├── pages/
│   ├── student/StudentLetters.tsx  # Student interface (COPY FROM UI)
│   └── admin/AdminLetters.tsx      # Admin interface (COPY FROM UI)
├── lib/
│   ├── constants.ts                # Add LETTER_ENDPOINTS
│   └── schemas.ts                  # Add letter validation schemas
└── components/
    └── letters/                    # Feature-specific components
        ├── ComposeLetterModal.tsx
        ├── LetterCard.tsx
        ├── LetterDetailDialog.tsx
        └── ModerationActions.tsx
```

---

## Redux State Management

### Letter State Structure

```typescript
interface Letter {
  id: string;
  userId: string;
  subject: string;
  content: string;
  contentSnippet?: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  viewCount: number;
  likeCount: number;
  currentUserLiked: boolean;
  currentVersion: number;
  totalVersions: number;
  coverImageUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface LetterVersion {
  id: string;
  versionNumber: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
  rejectedByAdmin?: { id: string; fullName: string };
  approvedByAdmin?: { id: string; fullName: string };
}

interface LetterSliceState {
  // Public Feed
  publicLetters: Letter[];
  publicPage: number;
  publicLimit: number;
  publicTotal: number;
  publicHasMore: boolean;
  publicSort: 'recent' | 'views' | 'likes';
  publicSearch: string;

  // My Letters (Student)
  myLetters: Letter[];
  myLettersPage: number;
  myLettersTotal: number;
  myLettersStatus: 'all' | 'pending' | 'approved' | 'rejected';

  // Moderation Queue (Admin)
  moderationLetters: Letter[];
  moderationPage: number;
  moderationStatus: 'all' | 'pending' | 'approved' | 'rejected';
  moderationSearch: string;

  // Letter Detail
  selectedLetter: Letter | null;
  selectedLetterVersions: LetterVersion[];

  // Stats
  stats: {
    totalLetters: number;
    pendingLetters: number;
    approvedLetters: number;
    rejectedLetters: number;
    totalViews: number;
    totalAcknowledgements: number;
  };

  // UI State
  loading: boolean;
  composingLetter: boolean;
  rejectingLetter: boolean;
  approvingLetter: boolean;
  error: string | null;
  successMessage: string | null;
}
```

### letterSlice.ts

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchPublicLetters, fetchMyLetters, createLetter, approveLetter, rejectLetter } from './letterThunks';

const initialState: LetterSliceState = {
  publicLetters: [],
  publicPage: 1,
  publicLimit: 20,
  publicTotal: 0,
  publicHasMore: true,
  publicSort: 'recent',
  publicSearch: '',

  myLetters: [],
  myLettersPage: 1,
  myLettersTotal: 0,
  myLettersStatus: 'all',

  moderationLetters: [],
  moderationPage: 1,
  moderationStatus: 'pending',
  moderationSearch: '',

  selectedLetter: null,
  selectedLetterVersions: [],

  stats: {
    totalLetters: 0,
    pendingLetters: 0,
    approvedLetters: 0,
    rejectedLetters: 0,
    totalViews: 0,
    totalAcknowledgements: 0,
  },

  loading: false,
  composingLetter: false,
  rejectingLetter: false,
  approvingLetter: false,
  error: null,
  successMessage: null,
};

const letterSlice = createSlice({
  name: 'letters',
  initialState,
  reducers: {
    // Filter & Search
    setPublicSearch: (state, action) => {
      state.publicSearch = action.payload;
      state.publicPage = 1;
    },
    setPublicSort: (state, action) => {
      state.publicSort = action.payload;
      state.publicPage = 1;
    },
    setPublicPage: (state, action) => {
      state.publicPage = action.payload;
    },

    // My Letters
    setMyLettersStatus: (state, action) => {
      state.myLettersStatus = action.payload;
      state.myLettersPage = 1;
    },
    setMyLettersPage: (state, action) => {
      state.myLettersPage = action.payload;
    },

    // Moderation
    setModerationStatus: (state, action) => {
      state.moderationStatus = action.payload;
      state.moderationPage = 1;
    },
    setModerationSearch: (state, action) => {
      state.moderationSearch = action.payload;
      state.moderationPage = 1;
    },
    setModerationPage: (state, action) => {
      state.moderationPage = action.payload;
    },

    // Detail View
    setSelectedLetter: (state, action) => {
      state.selectedLetter = action.payload;
    },
    clearSelectedLetter: (state) => {
      state.selectedLetter = null;
      state.selectedLetterVersions = [];
    },

    // UI State
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch Public Letters
    builder
      .addCase(fetchPublicLetters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicLetters.fulfilled, (state, action) => {
        state.loading = false;
        const { letters, pagination } = action.payload;

        // Append if pagination (infinite scroll), else replace
        if (state.publicPage === 1) {
          state.publicLetters = letters;
        } else {
          state.publicLetters = [...state.publicLetters, ...letters];
        }

        state.publicTotal = pagination.total;
        state.publicHasMore = pagination.hasMore;
      })
      .addCase(fetchPublicLetters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load letters';
      });

    // Fetch My Letters
    builder
      .addCase(fetchMyLetters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLetters.fulfilled, (state, action) => {
        state.loading = false;
        state.myLetters = action.payload.letters;
        state.myLettersTotal = action.payload.pagination.total;
      })
      .addCase(fetchMyLetters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load your letters';
      });

    // Create Letter
    builder
      .addCase(createLetter.pending, (state) => {
        state.composingLetter = true;
        state.error = null;
      })
      .addCase(createLetter.fulfilled, (state) => {
        state.composingLetter = false;
        state.successMessage = 'Letter submitted for review!';
        // Refresh my letters
        state.myLettersPage = 1;
      })
      .addCase(createLetter.rejected, (state, action) => {
        state.composingLetter = false;
        state.error = action.payload || 'Failed to submit letter';
      });

    // Approve Letter
    builder
      .addCase(approveLetter.pending, (state) => {
        state.approvingLetter = true;
        state.error = null;
      })
      .addCase(approveLetter.fulfilled, (state, action) => {
        state.approvingLetter = false;
        state.successMessage = 'Letter approved and published!';
        // Update in moderation list
        const index = state.moderationLetters.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.moderationLetters[index].status = 'approved';
        }
      })
      .addCase(approveLetter.rejected, (state, action) => {
        state.approvingLetter = false;
        state.error = action.payload || 'Failed to approve letter';
      });

    // Reject Letter
    builder
      .addCase(rejectLetter.pending, (state) => {
        state.rejectingLetter = true;
        state.error = null;
      })
      .addCase(rejectLetter.fulfilled, (state, action) => {
        state.rejectingLetter = false;
        state.successMessage = 'Letter rejected. Student can resubmit.';
        // Update in moderation list
        const index = state.moderationLetters.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.moderationLetters[index].status = 'rejected';
          state.moderationLetters[index].rejectionReason = action.payload.rejectionReason;
        }
      })
      .addCase(rejectLetter.rejected, (state, action) => {
        state.rejectingLetter = false;
        state.error = action.payload || 'Failed to reject letter';
      });
  },
});

export const {
  setPublicSearch,
  setPublicSort,
  setPublicPage,
  setMyLettersStatus,
  setMyLettersPage,
  setModerationStatus,
  setModerationSearch,
  setModerationPage,
  setSelectedLetter,
  clearSelectedLetter,
  clearError,
  clearSuccessMessage,
} = letterSlice.actions;

export default letterSlice.reducer;
```

### letterThunks.ts

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/client';
import { LETTER_ENDPOINTS } from '@/lib/constants';

export const fetchPublicLetters = createAsyncThunk(
  'letters/fetchPublic',
  async (
    params: {
      page: number;
      limit: number;
      sort: 'recent' | 'views' | 'likes';
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.get(LETTER_ENDPOINTS.PUBLIC, { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch letters');
    }
  }
);

export const fetchMyLetters = createAsyncThunk(
  'letters/fetchMy',
  async (
    params: {
      page: number;
      limit: number;
      status: 'all' | 'pending' | 'approved' | 'rejected';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.get(LETTER_ENDPOINTS.MY_LETTERS, { params });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch letters');
    }
  }
);

export const createLetter = createAsyncThunk(
  'letters/create',
  async (
    data: {
      subject: string;
      content: string;
      isAnonymous: boolean;
      coverImageMediaId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(LETTER_ENDPOINTS.CREATE, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to submit letter');
    }
  }
);

export const approveLetter = createAsyncThunk(
  'letters/approve',
  async (letterId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(LETTER_ENDPOINTS.APPROVE(letterId), {});
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to approve');
    }
  }
);

export const rejectLetter = createAsyncThunk(
  'letters/reject',
  async (
    { letterId, rejectionReason }: { letterId: string; rejectionReason: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.put(LETTER_ENDPOINTS.REJECT(letterId), {
        rejectionReason,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to reject');
    }
  }
);

export const toggleLike = createAsyncThunk(
  'letters/toggleLike',
  async (letterId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(LETTER_ENDPOINTS.ACKNOWLEDGE(letterId), {});
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to like');
    }
  }
);
```

---

## Pages & Components

### StudentLetters.tsx

**Source**: `C:\Users\Anathapadmanabhan\Desktop\UI\src\pages\student\StudentLetters.tsx`

**Integration Points**:
- Import Redux hooks (useAppDispatch, useAppSelector)
- Replace hardcoded `publicLetters` with Redux state
- Replace hardcoded `myLetters` with Redux state
- Wire up "Write a Letter" button to dispatch `createLetter` thunk
- Wire up infinite scroll to dispatch `fetchPublicLetters`
- Wire up like button to dispatch `toggleLike` thunk
- Wire up "My Letters" filters to dispatch `setMyLettersStatus`

**Key Methods to Add**:
```typescript
const dispatch = useAppDispatch();
const { publicLetters, myLetters, loading, error } = useAppSelector(state => state.letters);

// On mount
useEffect(() => {
  dispatch(fetchPublicLetters({ page: 1, limit: 20, sort: 'recent' }));
}, []);

// Compose letter
const handleComposeLetter = async (data) => {
  await dispatch(createLetter(data)).unwrap();
  setIsComposeOpen(false);
  toast.success('Letter submitted!');
};

// Like letter
const handleAcknowledge = (letterId) => {
  dispatch(toggleLike(letterId));
};
```

### AdminLetters.tsx

**Source**: `C:\Users\Anathapadmanabhan\Desktop\UI\src\pages\admin\AdminLetters.tsx`

**Integration Points**:
- Replace hardcoded `initialLetters` with Redux state
- Wire up status tabs to dispatch `setModerationStatus`
- Wire up search to dispatch `setModerationSearch`
- Wire up "Approve" button to dispatch `approveLetter` thunk
- Wire up "Reject" button to show modal and dispatch `rejectLetter` thunk
- Wire up "View Full Letter" to set selectedLetter and open dialog

**Key Methods**:
```typescript
const dispatch = useAppDispatch();
const { moderationLetters, stats, loading } = useAppSelector(state => state.letters);

// Approve
const handleApprove = (letterId) => {
  dispatch(approveLetter(letterId))
    .unwrap()
    .then(() => toast.success('Letter approved!'));
};

// Reject
const handleReject = (letterId, reason) => {
  dispatch(rejectLetter({ letterId, rejectionReason: reason }))
    .unwrap()
    .then(() => toast.success('Letter rejected'));
};
```

### Feature-Specific Components

#### ComposeLetterModal.tsx
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLetterData) => Promise<void>;
  isLoading: boolean;
}

// Form handling with React Hook Form + Zod schema
// Features:
// - Subject input (5-200 chars)
// - Content textarea (10-5000 chars, Courier font)
// - Cover image upload
// - Anonymous toggle
// - Send button (disabled if invalid)
```

#### LetterCard.tsx
```typescript
interface Props {
  letter: Letter;
  isPublic?: boolean;
  onRead: () => void;
  onLike: (id: string) => void;
  isLiked: boolean;
}

// Renders letter card with:
// - Author info
// - Subject
// - Content snippet
// - View count
// - Like button
// - Cover image (if exists)
```

#### LetterDetailDialog.tsx
```typescript
interface Props {
  letter: Letter | null;
  isOpen: boolean;
  onClose: () => void;
  onLike: (id: string) => void;
  userLiked: boolean;
}

// Full letter view with:
// - Cover image
// - Full content (Courier font)
// - Author metadata
// - Like button
// - For admin: Approve/Reject buttons
```

#### ModerationActions.tsx
```typescript
interface Props {
  letterId: string;
  status: string;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  isLoading: boolean;
}

// Render quick action buttons:
// - Checkmark for approve
// - X for reject
// - More menu with delete option
```

---

## Implementation Tasks

### Phase 1: Redux Setup (1 day)

- [ ] Create `client/src/store/slices/letterSlice.ts`
- [ ] Create `client/src/store/slices/letterThunks.ts`
- [ ] Register letterReducer in Redux store
- [ ] Add LETTER_ENDPOINTS to `lib/constants.ts`
- [ ] Add letter validation schemas to `lib/schemas.ts`

### Phase 2: Student Pages (2 days)

- [ ] Copy StudentLetters.tsx from UI folder
- [ ] Wire up Redux dispatch for fetchPublicLetters
- [ ] Wire up infinite scroll pagination
- [ ] Wire up createLetter form submission
- [ ] Wire up toggleLike button
- [ ] Wire up myLetters tab and filters
- [ ] Add state persistence (scroll position)
- [ ] Test all flows

### Phase 3: Admin Pages (2 days)

- [ ] Copy AdminLetters.tsx from UI folder
- [ ] Wire up Redux dispatch for fetchModerationQueue
- [ ] Wire up search and status filters
- [ ] Wire up approve button
- [ ] Wire up reject with modal
- [ ] Wire up delete button
- [ ] Wire up anonymous identity tooltip
- [ ] Test all moderation flows

### Phase 4: Feature Components (1 day)

- [ ] Create ComposeLetterModal.tsx
- [ ] Create LetterCard.tsx
- [ ] Create LetterDetailDialog.tsx
- [ ] Create ModerationActions.tsx
- [ ] Extract repeated code into components

### Phase 5: Polish & Testing (1 day)

- [ ] Add error handling with toast notifications
- [ ] Add loading states (spinners, skeleton screens)
- [ ] Test infinite scroll
- [ ] Test state persistence
- [ ] Test error scenarios
- [ ] Verify Courier font styling
- [ ] Verify paper plane icon display
- [ ] Test anonymous identity reveal (hover)

---

## State Persistence

### Scroll Position & Pagination

**Requirement**: User should return to exact scroll position after viewing a letter.

**Implementation**:

```typescript
// src/hooks/useScrollPersistence.ts
const useScrollPersistence = (key: string) => {
  const [scrollPos, setScrollPos] = useState(0);

  const saveScrollPos = () => {
    const element = document.querySelector('.letters-feed');
    if (element) {
      sessionStorage.setItem(`scroll_${key}`, element.scrollTop.toString());
    }
  };

  const restoreScrollPos = () => {
    const saved = sessionStorage.getItem(`scroll_${key}`);
    if (saved) {
      setTimeout(() => {
        const element = document.querySelector('.letters-feed');
        if (element) element.scrollTop = parseInt(saved);
      }, 100);
    }
  };

  return { saveScrollPos, restoreScrollPos };
};
```

**Usage in StudentLetters.tsx**:

```typescript
const { saveScrollPos, restoreScrollPos } = useScrollPersistence('letters-public');

// Before opening letter detail
const handleReadLetter = (letter) => {
  saveScrollPos();
  setSelectedLetter(letter);
};

// When closing letter detail
const handleCloseDetail = () => {
  setSelectedLetter(null);
  restoreScrollPos();
};
```

---

## Error Handling

### Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('Letter submitted for review!');

// Error
toast.error(error || 'Something went wrong');

// Loading
const { dismiss } = toast.loading('Submitting...');
// Later: dismiss();
```

### Error Boundary (Wrapper)

```typescript
<ErrorBoundary fallback={<LettersErrorScreen />}>
  <StudentLetters />
</ErrorBoundary>
```

### Field-Level Validation

```typescript
const schema = z.object({
  subject: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  isAnonymous: z.boolean().optional(),
});

// In form component
const form = useForm({
  resolver: zodResolver(schema),
});

// Show error
{form.formState.errors.subject && (
  <span className="text-red-500">{form.formState.errors.subject.message}</span>
)}
```

---

## Constants & Schemas

### Add to lib/constants.ts

```typescript
export const LETTER_ENDPOINTS = {
  PUBLIC: '/letters/public',
  MY_LETTERS: '/letters/my-letters',
  CREATE: '/letters',
  GET: (id: string) => `/letters/${id}`,
  ACKNOWLEDGE: (id: string) => `/letters/${id}/acknowledge`,
  MODERATION: '/letters/admin/moderation',
  APPROVE: (id: string) => `/letters/${id}/approve`,
  REJECT: (id: string) => `/letters/${id}/reject`,
  DELETE: (id: string) => `/letters/${id}`,
  VERSIONS: (id: string) => `/letters/${id}/versions`,
  STATS: '/letters/admin/stats',
};

export const LETTER_MESSAGES = {
  SUBMITTED: 'Letter submitted! Awaiting admin review...',
  APPROVED: 'Letter approved and published!',
  REJECTED: 'Letter rejected. You can edit and resubmit.',
  DELETED: 'Letter deleted successfully',
  LIKE_SUCCESS: 'Acknowledgement added!',
  LIKE_REMOVED: 'Acknowledgement removed',
};

export const LETTER_LIMITS = {
  SUBJECT_MIN: 5,
  SUBJECT_MAX: 200,
  CONTENT_MIN: 10,
  CONTENT_MAX: 5000,
  REJECTION_MIN: 10,
  REJECTION_MAX: 500,
  COVER_IMAGE_MAX_MB: 5,
};
```

### Add to lib/schemas.ts

```typescript
export const createLetterSchema = z.object({
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content must be less than 5000 characters'),
  isAnonymous: z.boolean().optional(),
  coverImageMediaId: z.string().uuid().optional(),
});

export const rejectLetterSchema = z.object({
  rejectionReason: z.string()
    .min(10, 'Please provide a reason (min 10 characters)')
    .max(500, 'Reason must be less than 500 characters'),
});

export type CreateLetterInput = z.infer<typeof createLetterSchema>;
export type RejectLetterInput = z.infer<typeof rejectLetterSchema>;
```

---

## Quick Reference

### File Structure

```
client/src/
├── store/slices/
│   ├── letterSlice.ts (400 lines)
│   └── letterThunks.ts (300 lines)
├── pages/
│   ├── student/StudentLetters.tsx (COPY from UI)
│   └── admin/AdminLetters.tsx (COPY from UI)
├── components/letters/
│   ├── ComposeLetterModal.tsx (150 lines)
│   ├── LetterCard.tsx (100 lines)
│   ├── LetterDetailDialog.tsx (150 lines)
│   └── ModerationActions.tsx (80 lines)
├── lib/
│   ├── constants.ts (ADD LETTER_ENDPOINTS)
│   └── schemas.ts (ADD letter schemas)
└── hooks/
    └── useScrollPersistence.ts (50 lines)
```

### Development Workflow

1. Read UI components from C:\Users\Anathapadmanabhan\Desktop\UI
2. Copy StudentLetters.tsx and AdminLetters.tsx to client/src/pages
3. Create Redux slice and thunks
4. Replace hardcoded data with Redux dispatch
5. Extract reusable components
6. Wire up all event handlers
7. Test all flows
8. Add state persistence
9. Add error handling

---

**Next**: Read [LETTERS_STATE_MANAGEMENT.md](LETTERS_STATE_MANAGEMENT.md) for detailed Redux patterns
