# PlaneAndProp Client - Developer Guide

**Last Updated**: May 18, 2026
**Current Phase**: Phase 8 - Component Refactoring & Architecture Optimization

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Component Organization](#component-organization)
5. [State Management](#state-management)
6. [Authentication Flow](#authentication-flow)
7. [Admin Pages Flow](#admin-pages-flow)
8. [Development Patterns](#development-patterns)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Project Overview

PlaneAndProp is a full-stack education management platform with a React TypeScript frontend. The client application focuses on:

- **User Authentication**: Email verification, password reset, JWT-based auth with refresh tokens
- **User Management**: Admin interface for managing students and mentors
- **Roles & Permissions**: Dynamic role-based access control with permission management
- **State Management**: Redux Toolkit with async thunks (not RTK Query)
- **Component Reusability**: Shared components for pagination, search/filter, deletion, stats display

### Key Tech Stack

- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit + Async Thunks + Axios
- **UI Components**: shadcn/ui (Radix UI) + Tailwind CSS
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with auto-refresh interceptor
- **Routing**: React Router v6
- **Notifications**: Sonner (toast notifications)

---

## Architecture

### Design Principles

#### ✅ **Simplicity Over Complexity**
- Redux Toolkit with async thunks, not RTK Query
- Direct control over state updates ensures tokens persist correctly
- Predictable, easier to debug than RTK Query's onQueryStarted hooks

#### ✅ **Component Reusability**
- **Shared Components**: Generic components used across the app (pagination, search, stats, delete dialog)
- **Admin-Specific Components**: Components for admin-only features (permission checkboxes, status badge dropdown)
- **Input Components**: Standardized form inputs (InputText, InputTextarea, etc.) with consistent patterns

#### ✅ **Feature-Based Organization**
- Auth pages grouped in `/auth`
- Admin pages grouped in `/admin`
- Components organized by scope: shared, admin, auth, ui

#### ✅ **Single Responsibility**
- Each component has one clear purpose
- Form logic is handled by React Hook Form + Zod
- State management is centralized in Redux

---

## Project Structure

```
client/
├── src/
│   ├── api/
│   │   └── client.ts                 # Axios instance with auto-refresh interceptor
│   │
│   ├── components/
│   │   ├── shared/                   # Reusable across entire app
│   │   │   ├── DeleteConfirmDialog.tsx
│   │   │   ├── SearchFilterBar.tsx
│   │   │   ├── PaginationControls.tsx
│   │   │   ├── TableActionButtons.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── admin/                    # Admin-specific components
│   │   │   ├── StatusBadgeDropdown.tsx   # User status (ACTIVE/INACTIVE/SUSPENDED)
│   │   │   ├── PermissionCheckboxGroup.tsx  # Role permission management
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── auth/                     # Authentication UI
│   │   │   ├── layouts/
│   │   │   │   ├── AuthLayoutContainer.tsx
│   │   │   │   ├── TwoColumnAuthLayout.tsx
│   │   │   │   └── CenteredAuthLayout.tsx
│   │   │   ├── sections/
│   │   │   │   ├── AuthLogoHeader.tsx
│   │   │   │   ├── AuthHeroSidebar.tsx
│   │   │   │   ├── AuthFormCard.tsx
│   │   │   │   ├── AuthFormHeader.tsx
│   │   │   │   ├── SuccessStateModal.tsx
│   │   │   │   └── ResendOtpSection.tsx
│   │   │   ├── buttons/
│   │   │   │   ├── AuthSubmitButton.tsx
│   │   │   │   ├── AuthFooterLink.tsx
│   │   │   │   └── ResendButton.tsx
│   │   │   ├── constants.ts          # Auth UI messages & hero content
│   │   │   └── index.ts
│   │   │
│   │   └── ui/                       # Base UI components + form inputs
│   │       ├── input-text.tsx        # Text/email/password input
│   │       ├── input-textarea.tsx    # Textarea input
│   │       ├── input-checkbox.tsx    # Checkbox input
│   │       ├── input-select.tsx      # Select/dropdown input
│   │       ├── password-input-field.tsx
│   │       ├── confirm-password-field.tsx
│   │       ├── otp-input-field.tsx
│   │       ├── [other shadcn components]
│   │       └── index.ts
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── EmailVerificationPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminStudents.tsx     # Student management with refactored StatCard
│   │   │   ├── AdminRoles.tsx        # Role & permission management with StatCard
│   │   │   ├── AdminMentors.tsx
│   │   │   ├── UserDetailModal.tsx   # View/edit student/mentor details
│   │   │   └── AdminUserManagement.tsx
│   │   │
│   │   └── HomePage.tsx
│   │
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts          # Auth state + reducers
│   │   │   ├── authThunks.ts         # Auth async thunks (signIn, signUp, etc.)
│   │   │   ├── userManagementSlice.ts # User management state
│   │   │   └── rolesSlice.ts         # Roles & permissions state
│   │   │
│   │   └── index.ts                  # Store configuration + middleware
│   │
│   ├── hooks/
│   │   └── redux.ts                  # useAppDispatch, useAppSelector
│   │
│   ├── lib/
│   │   ├── constants.ts              # Route endpoints, API paths
│   │   ├── schemas.ts                # Zod validation schemas
│   │   └── utils.ts                  # Helper functions
│   │
│   └── App.tsx                       # Router configuration
```

---

## Component Organization

### Component Categories

#### 1. **Shared Components** (`/components/shared/`)
Generic, reusable components that work anywhere in the app.

| Component | Purpose | Props |
|-----------|---------|-------|
| **StatCard** | Display stats with icon, label, value | `icon`, `label`, `value`, `variant` |
| **SearchFilterBar** | Search input + filter dropdown | `searchValue`, `onSearchChange`, `onSearch`, `filterValue`, `filterOptions` |
| **PaginationControls** | Previous/Next pagination | `currentPage`, `totalPages`, `onPageChange` |
| **TableActionButtons** | View/Edit/Delete action buttons | `onView`, `onEdit`, `onDelete`, `*Title` props |
| **DeleteConfirmDialog** | Delete confirmation modal | `isOpen`, `title`, `itemName`, `isDeleting`, `onConfirm`, `onCancel` |

**Usage Pattern:**
```tsx
import { StatCard, SearchFilterBar, PaginationControls } from "@/components/shared";
```

#### 2. **Admin Components** (`/components/admin/`)
Admin-specific components for user management and permissions.

| Component | Purpose | Props |
|-----------|---------|-------|
| **StatusBadgeDropdown** | User status selector (ACTIVE/INACTIVE/SUSPENDED) | `status`, `onStatusChange` |
| **PermissionCheckboxGroup** | Grouped permission checkboxes by module | `module`, `permissions`, `assignedIds`, `onToggle` |

**Usage Pattern:**
```tsx
import { StatusBadgeDropdown, PermissionCheckboxGroup } from "@/components/admin";
```

#### 3. **Auth Components** (`/components/auth/`)
Reusable auth UI components for all auth pages.

**Layouts** (page containers):
- `AuthLayoutContainer` - Base container with gradient bg
- `TwoColumnAuthLayout` - Hero sidebar + form column
- `CenteredAuthLayout` - Single column centered

**Sections** (form building blocks):
- `AuthLogoHeader` - Logo/branding
- `AuthFormCard` - Form card wrapper
- `AuthFormHeader` - Icon + heading + subtitle
- `SuccessStateModal` - Success screen
- `ResendOtpSection` - OTP resend timer

**Buttons**:
- `AuthSubmitButton` - Submit with loading state
- `AuthFooterLink` - Navigation link
- `ResendButton` - Resend with timer

**Usage Pattern:**
```tsx
import {
  AuthLayoutContainer,
  CenteredAuthLayout,
  AuthLogoHeader,
  AuthFormCard,
  AuthSubmitButton,
  AuthFooterLink,
} from "@/components/auth/[category]";
```

#### 4. **Input Components** (`/components/ui/`)
Standardized form inputs using React Hook Form.

**New Input Pattern** (recommended):
```tsx
<InputText
  hookForm={form}           // useForm return value
  field="email"             // field name from form
  label="Email"
  placeholder="Enter email..."
  disabled={isLoading}
/>
```

Advantages over old FormInput:
- ✅ Simpler API: `hookForm={form}` vs `control={form.control}`
- ✅ Direct access to form methods: `setValue`, `getValues`, `setError`
- ✅ Advanced features: text transforms, conditional validation
- ✅ Type-safe field names with TypeScript generics

**Available Input Components**:
- `InputText` - text, email, password, tel inputs
- `InputTextarea` - multiline text
- `InputCheckbox` - checkbox with label
- `InputSelect` - dropdown select
- `PasswordInputField` - password with Eye toggle
- `ConfirmPasswordField` - password confirmation with toggle
- `OtpInputField` - numeric OTP input

---

## State Management

### Redux Architecture

```
Store
├── auth (authSlice)
│   ├── user
│   ├── tokens (access, refresh)
│   ├── loading
│   ├── error
│   └── successMessage
│
├── userManagement (userManagementSlice)
│   ├── users[]
│   ├── pagination
│   ├── filters
│   ├── loading
│   ├── error
│   └── successMessage
│
└── roles (rolesSlice)
    ├── roles[]
    ├── permissions[]
    ├── loading
    └── error
```

### Auth Slice Pattern

```tsx
// authSlice.ts - State + Reducers + ExtraReducers
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Sync actions
    logout: (state) => { /* ... */ },
  },
  extraReducers: (builder) => {
    // Async thunk handlers
    builder
      .addCase(signIn.fulfilled, (state, action) => { /* ... */ })
      .addCase(signIn.rejected, (state, action) => { /* ... */ });
  },
});

// authThunks.ts - Async Thunks
export const signIn = createAsyncThunk(
  "auth/signIn",
  async (credentials, { rejectWithValue }) => {
    const response = await apiClient.post("/auth/signin", credentials);
    return response.data;
  }
);

// Usage in components
const dispatch = useAppDispatch();
const { user, loading, error } = useAppSelector(state => state.auth);

const handleSubmit = async (data) => {
  try {
    const result = await dispatch(signIn(data)).unwrap();
    // Success
  } catch (err) {
    // Error handling
  }
};
```

### Why Not RTK Query?

**Decision**: Use Redux Thunks + Axios instead of RTK Query

**Reasons**:
1. **Simpler API**: Direct control over state updates
2. **Token Persistence**: Easier to ensure JWT tokens save to localStorage
3. **Less Boilerplate**: No onQueryStarted hooks or cache management
4. **Familiar Pattern**: Async thunks are standard Redux pattern
5. **Fewer Surprises**: Predictable behavior, easier debugging

### Persistence

Redux-persist automatically saves auth slice to localStorage:
```tsx
// store/index.ts
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist auth slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
```

---

## Authentication Flow

### High-Level Flow

```
User Input
    ↓
React Hook Form (validation)
    ↓
Dispatch Redux Thunk (API call)
    ↓
Axios Client (with interceptors)
    ↓
Backend API
    ↓
Response Handler (token storage, user data)
    ↓
Redux State Update
    ↓
Navigation + Toast Notification
```

### Detailed Flow: Sign In

**File**: `src/pages/auth/LoginPage.tsx`

```tsx
1. User enters credentials
   ↓
2. Form validation (React Hook Form + Zod)
   ↓
3. Dispatch signIn thunk
   ↓
4. Axios makes POST /api/auth/signin request
   ↓
5. Response contains:
   - user (id, email, fullName, role)
   - tokens (accessToken, refreshToken)
   ↓
6. authSlice.ts reducers:
   - Save user to state
   - Save tokens to localStorage (via redux-persist)
   ↓
7. Axios interceptor adds Authorization header for future requests
   ↓
8. Display success toast
   ↓
9. Navigate to HOME
```

### Token Management

**Axios Interceptor** (`src/api/client.ts`):
```tsx
// Request: Add access token to headers
client.interceptors.request.use((config) => {
  const token = getFromStorage("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: Auto-refresh on 401 (token expired)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt refresh
      const newToken = await refreshAccessToken();
      // Retry original request with new token
    }
  }
);
```

### All Auth Thunks

| Thunk | Purpose | Input | Output |
|-------|---------|-------|--------|
| `signIn` | User login | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `signUp` | New user registration | `{ fullName, email, password }` | `{ user, tokens }` |
| `verifyEmail` | Verify OTP | `{ email, otp }` | `{ success: true }` |
| `resendOtp` | Resend OTP | `{ email }` | `{ success: true }` |
| `forgotPassword` | Request reset link | `{ email }` | `{ success: true }` |
| `resetPassword` | Set new password | `{ email, token, newPassword }` | `{ success: true }` |
| `refreshToken` | Get new access token | `{ refreshToken }` | `{ accessToken }` |
| `logout` | Sync action - clear auth | - | Clear user & tokens |

---

## Admin Pages Flow

### AdminStudents.tsx Flow

```
Component Mounts
    ↓
useEffect → dispatch getAllUsers(params)
    ↓
Redux thunk fetches students with filters/pagination
    ↓
User selects search/filter/page
    ↓
dispatch setFilters() → triggers refetch via useEffect
    ↓
Render with StatCard (stats), SearchFilterBar (search), Table, PaginationControls
    ↓
User actions:
  ├→ View → UserDetailModal (read-only)
  ├→ Edit → UserDetailModal (edit mode)
  └→ Delete → DeleteConfirmDialog → dispatch deleteUser()
    ↓
Success toast → update UI
```

**Key Components Used**:
- `StatCard` × 4 (Total, Active, Inactive, Suspended)
- `SearchFilterBar` (search + filter dropdown)
- `StatusBadgeDropdown` (change user status in table)
- `TableActionButtons` (View/Edit/Delete)
- `PaginationControls` (Previous/Next)
- `DeleteConfirmDialog` (delete confirmation)
- `UserDetailModal` (detail view/edit)

### AdminRoles.tsx Flow

```
Component Mounts
    ↓
useEffect → dispatch getAllRoles() + getAllPermissions()
    ↓
Redux thunks fetch roles and permissions
    ↓
Group permissions by module (local calculation)
    ↓
Render with StatCard (stats), Role cards grid
    ↓
User clicks Edit on role card
    ↓
Dialog opens with PermissionCheckboxGroup (grouped by module)
    ↓
User toggles permission checkbox
    ↓
Immediately dispatch assignPermissionToRole() OR removePermissionFromRole()
    ↓
Success toast → update role.permissions in state
```

**Key Components Used**:
- `StatCard` × 2 (Total Roles, Permissions count)
- `PermissionCheckboxGroup` (permission management)
- Native Dialog component

---

## Development Patterns

### Pattern 1: Creating a New Admin Page with Search + Pagination

```tsx
// pages/admin/NewListPage.tsx
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  SearchFilterBar,
  PaginationControls,
  TableActionButtons,
  StatCard,
  DeleteConfirmDialog,
} from "@/components/shared";

export function NewListPage() {
  const dispatch = useAppDispatch();
  const { items, pagination, filters, loading } = useAppSelector(
    (state) => state.yourSlice
  );

  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch on mount and when filters change
  useEffect(() => {
    dispatch(getAllItems({
      page: filters.page,
      search: searchQuery,
    }));
  }, [filters.page, searchQuery, dispatch]);

  const handleSearch = () => {
    dispatch(setFilters({ page: 1, search: searchQuery }));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteItem(deleteConfirm.id)).unwrap();
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Items</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={<Icon className="w-5 h-5" />}
          label="Total Items"
          value={pagination.total}
          variant="primary"
        />
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Table */}
      <table className="w-full">
        {/* Table content */}
      </table>

      {/* Pagination */}
      {!loading && items.length > 0 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => dispatch(setFilters({ page }))}
        />
      )}

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Item"
        itemName={deleteConfirm?.name}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
```

### Pattern 2: Creating a New Form Page

```tsx
// pages/SomePage.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { InputText, InputTextarea, InputSelect } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { someSchema } from "@/lib/schemas";
import { somethingThunk } from "@/store/slices/someSlice";
import { useAppDispatch } from "@/hooks/redux";

export function SomePage() {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(someSchema),
    defaultValues: { /* ... */ },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await dispatch(somethingThunk(data)).unwrap();
      toast.success("Success!");
      navigate("/somewhere");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <InputText
        hookForm={form}
        field="fieldName"
        label="Label"
        disabled={isLoading}
      />

      <InputTextarea
        hookForm={form}
        field="description"
        label="Description"
        disabled={isLoading}
      />

      <InputSelect
        hookForm={form}
        field="category"
        label="Category"
        options={[
          { value: "cat1", label: "Category 1" },
        ]}
        disabled={isLoading}
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Loading..." : "Submit"}
      </Button>
    </form>
  );
}
```

### Pattern 3: Using Shared Components in Any Page

```tsx
// Example: Using StatCard anywhere
import { StatCard } from "@/components/shared";
import { TrendingUp } from "lucide-react";

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <StatCard
    icon={<TrendingUp className="w-5 h-5" />}
    label="Revenue"
    value="$45,231"
    variant="success"
  />
  {/* More cards */}
</div>
```

---

## Best Practices

### 1. **Always Use Shared Components**
If you need pagination, search, delete dialog, or stats display → use shared components instead of recreating.

```tsx
// ✅ GOOD
import { StatCard, PaginationControls } from "@/components/shared";

// ❌ BAD
<div className="grid gap-4">
  <div className="bg-primary/5 p-4 rounded-lg">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
</div>
```

### 2. **Use InputText for All Text-Like Inputs**
Standardizes form handling across the app.

```tsx
// ✅ GOOD
<InputText
  hookForm={form}
  field="email"
  label="Email"
  type="email"
/>

// ❌ BAD
<div>
  <label>Email</label>
  <input {...form.register("email")} />
  {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}
</div>
```

### 3. **Always Unwrap Thunks in Try-Catch**
Ensures proper error handling and loading states.

```tsx
// ✅ GOOD
try {
  await dispatch(someThunk(data)).unwrap();
  toast.success("Done!");
} catch (error) {
  toast.error(getErrorMessage(error));
}

// ❌ BAD
dispatch(someThunk(data));
// No error handling
```

### 4. **Separate Concerns: Reducers vs Thunks**
- **Reducers**: Sync state updates (logout, setFilters)
- **Thunks**: Async API calls (signIn, getAllUsers)

```tsx
// ✅ GOOD
// authSlice.ts
reducers: {
  logout: (state) => { state.user = null; },
  setTokens: (state, action) => { state.tokens = action.payload; },
}

// authThunks.ts
export const signIn = createAsyncThunk(...);

// ❌ BAD - mixing async logic in reducers
reducers: {
  signIn: async (state, action) => { /* API call here */ }
}
```

### 5. **Type Safety with TypeScript**
Always type components and functions.

```tsx
// ✅ GOOD
interface UserCardProps {
  user: User;
  onDelete: (id: string) => void;
}

export function UserCard({ user, onDelete }: UserCardProps) {
  // ...
}

// ❌ BAD
export function UserCard({ user, onDelete }: any) {
  // ...
}
```

### 6. **Use React Hook Form + Zod**
For all form validation.

```tsx
// ✅ GOOD
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm({
  resolver: zodResolver(schema),
});

// ❌ BAD - manual validation
const [email, setEmail] = useState("");
const [emailError, setEmailError] = useState("");

const handleChange = (e) => {
  const val = e.target.value;
  if (!val.includes("@")) {
    setEmailError("Invalid email");
  }
};
```

### 7. **Extract Complex JSX into Components**
Keep components focused and readable.

```tsx
// ✅ GOOD
<div className="space-y-4">
  <UserCard user={user} />
  <UserActions user={user} />
</div>

// ❌ BAD - everything inline
<div className="space-y-4">
  <div>
    <img src={user.avatar} />
    <h3>{user.name}</h3>
  </div>
  <button onClick={() => {}}>Edit</button>
  <button onClick={() => {}}>Delete</button>
</div>
```

### 8. **Handle Errors Consistently**
Use error mapping and toast notifications.

```tsx
// ✅ GOOD
const mapBackendErrorToField = (error, setError) => {
  // Maps backend 400 error details to form fields
  const fieldErrors = error.response?.data?.errors;
  return Object.entries(fieldErrors).map(([field, msg]) => {
    setError(field, { message: msg });
  });
};

// ❌ BAD
toast.error(error.message);
```

---

## Examples

### Example 1: Adding a New Admin Page (Mentors List)

**File Structure**:
```
client/src/pages/admin/AdminMentors.tsx
client/src/store/slices/mentorSlice.ts
client/src/lib/constants.ts (update MENTOR_ENDPOINTS)
```

**Step 1**: Create Redux Slice
```tsx
// store/slices/mentorSlice.ts
const mentorSlice = createSlice({
  name: "mentors",
  initialState: {
    mentors: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    filters: { search: "", role: "MENTOR" },
    loading: false,
    error: null,
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllMentors.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllMentors.fulfilled, (state, action) => {
        state.mentors = action.payload.users;
        state.pagination = action.payload.pagination;
        state.loading = false;
      });
  },
});

export const getAllMentors = createAsyncThunk(
  "mentors/getAll",
  async (params: PaginationParams) => {
    const response = await apiClient.get("/users", { params });
    return response.data;
  }
);
```

**Step 2**: Create Admin Page
```tsx
// pages/admin/AdminMentors.tsx
export function AdminMentors() {
  const dispatch = useAppDispatch();
  const { mentors, pagination, filters, loading } = useAppSelector(
    (state) => state.mentors
  );

  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  useEffect(() => {
    dispatch(getAllMentors({
      page: filters.page,
      search: searchQuery,
      role: "MENTOR",
    }));
  }, [filters.page, searchQuery, dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mentors</h1>

      <StatCard
        icon={<Users className="w-5 h-5" />}
        label="Total Mentors"
        value={pagination.total}
      />

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => dispatch(setFilters({ page: 1 }))}
      />

      {/* Table with mentors */}

      <PaginationControls
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => dispatch(setFilters({ page }))}
      />
    </div>
  );
}
```

### Example 2: Creating a Modal for Editing User Profile

**Component Structure**:
```tsx
// components/UserEditModal.tsx
interface UserEditModalProps {
  userId: string;
  onClose: () => void;
}

export function UserEditModal({ userId, onClose }: UserEditModalProps) {
  const form = useForm({
    resolver: zodResolver(userProfileSchema),
  });

  const onSubmit = async (data) => {
    try {
      await dispatch(updateUserProfile(data)).unwrap();
      toast.success("Profile updated!");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <InputText hookForm={form} field="fullName" label="Full Name" />
          <InputTextarea hookForm={form} field="bio" label="Bio" />
          <InputText hookForm={form} field="phone" label="Phone" type="tel" />

          <Button type="submit">Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Example 3: Reusing DeleteConfirmDialog

```tsx
const [deleteConfirm, setDeleteConfirm] = useState(null);

// In table row
<button onClick={() => setDeleteConfirm({ id: user.id, email: user.email })}>
  Delete
</button>

// At bottom of page
<DeleteConfirmDialog
  isOpen={!!deleteConfirm}
  title="Delete User"
  itemName={deleteConfirm?.email}
  isDeleting={isDeleting}
  onConfirm={async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteUser(deleteConfirm.id)).unwrap();
      setDeleteConfirm(null);
      toast.success("User deleted!");
    } finally {
      setIsDeleting(false);
    }
  }}
  onCancel={() => setDeleteConfirm(null)}
/>
```

---

## Summary

| Aspect | Approach |
|--------|----------|
| **State Management** | Redux Toolkit + Async Thunks + Redux Persist |
| **Forms** | React Hook Form + Zod validation |
| **API Calls** | Axios with auto-refresh interceptor |
| **Components** | Shared (generic) vs Admin-specific |
| **Input Fields** | New InputText pattern with hookForm prop |
| **Reusability** | SearchFilterBar, PaginationControls, DeleteConfirmDialog, StatCard, TableActionButtons |
| **Authentication** | JWT tokens + email verification + password reset |
| **Styling** | Tailwind CSS + Radix UI (shadcn) |
| **Animations** | Framer Motion |

---

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

---

**For questions or updates, refer to the latest docs or PHASE documentation.**
