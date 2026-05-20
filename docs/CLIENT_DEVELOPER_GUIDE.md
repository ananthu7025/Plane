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

### Redux Slice Pattern (Plain Thunks)

⚠️ **Important**: This project uses **plain Redux dispatch thunks**, NOT `createAsyncThunk`.

#### authSlice.ts - State + Synchronous Reducers

```tsx
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isHydrated: false,
    pendingVerificationEmail: null,
  },
  reducers: {
    // Synchronous actions - directly update state
    setCredentials: (state, action: PayloadAction<{
      user: ApiUser;
      accessToken: string;
      refreshToken: string;
    }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },

    updateTokens: (state, action: PayloadAction<{
      accessToken: string;
      refreshToken: string;
    }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },

    setHydrated: (state) => {
      state.isHydrated = true;
    },

    setPendingVerificationEmail: (state, action: PayloadAction<string | null>) => {
      state.pendingVerificationEmail = action.payload;
    },
  },
});

export const {
  setCredentials,
  updateTokens,
  clearCredentials,
  setHydrated,
  setPendingVerificationEmail,
} = authSlice.actions;

export default authSlice.reducer;
```

#### authSlice.ts - Plain Dispatch Thunks

```tsx
/**
 * Plain Redux thunk pattern:
 * Function → Returns async function → Accepts dispatch
 * No createAsyncThunk wrapper
 */
export function signIn(credentials: SignInRequest) {
  return async function (dispatch: Dispatch) {
    try {
      const response = await axiosInstance.post<ApiResponse<SignInData>>(
        AUTH_ENDPOINTS.SIGNIN,
        credentials,
      );
      const data = response.data.data;

      // Manually dispatch the synchronous reducer
      dispatch(
        setCredentials({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );

      return data; // Return data for component to handle
    } catch (error: any) {
      // Manual error handling
      if (error.response?.data?.error?.code === "UNAUTHORIZED") {
        dispatch(setPendingVerificationEmail(credentials.email));
      }
      throw error; // Component catches with try-catch
    }
  };
}

export function signOut(refreshToken: string) {
  return async function (dispatch: Dispatch) {
    try {
      await axiosInstance.post(AUTH_ENDPOINTS.SIGNOUT, { refreshToken });
    } finally {
      // Always clear auth, whether request succeeds or fails
      dispatch(clearCredentials());
    }
  };
}
```

#### Usage in Components

```tsx
const dispatch = useAppDispatch();
const { user, isAuthenticated } = useAppSelector(state => state.auth);

const handleSubmit = async (data: LoginFormData) => {
  try {
    // Dispatch returns the thunk function
    // Call it like a normal async function
    const result = await dispatch(signIn(data) as any);

    // Handle success
    toast.success("Logged in successfully!");
    navigate("/home");
  } catch (error: any) {
    // Handle error - component responsible for toast
    const message = error.response?.data?.error?.message || "Login failed";
    toast.error(message);
  }
};
```

#### Key Differences from `createAsyncThunk`:

| Aspect | Plain Thunks | createAsyncThunk |
|--------|--------------|-----------------|
| **Definition** | Function returning async function | RTK API |
| **Error Handling** | Manual try-catch | Automatic with rejectWithValue |
| **Dispatch** | Direct dispatch() calls | Automatic from builder |
| **Return** | Direct values from thunk | Automatic promise wrapping |
| **Unwrap** | Not available - use try-catch | Available via .unwrap() |
| **TypeScript** | Simple type-safe | Complex generic types |
| **Debugging** | Very clear dispatch flow | RTK magic sometimes obscures flow |

### Why Plain Thunks (Not createAsyncThunk or RTK Query)?

**Decision**: Use plain Redux dispatch thunks + Axios instead of `createAsyncThunk` or RTK Query

**Reasons**:
1. **Explicit Control**: Every step is visible - dispatch reducers directly
2. **Token Persistence**: Easy to verify tokens save to localStorage via redux-persist
3. **Multiple Operations**: Easy to track separate loading states (list loading vs update loading)
4. **Error Handling**: Clear try-catch pattern, manual toast notifications
5. **Debugging**: Direct dispatch trail in Redux DevTools, no RTK magic
6. **Less Abstraction**: Plain functions return async functions - straightforward to understand
7. **Team Familiarity**: JavaScript developers understand this pattern intuitively

**Plain Thunks vs createAsyncThunk vs RTK Query**:

| Aspect | Plain Thunks | createAsyncThunk | RTK Query |
|--------|--------------|-----------------|-----------|
| Learning curve | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Boilerplate | Minimal | Medium | Minimal |
| Start/Success/Error | Manual | Automatic | N/A (cache) |
| Multiple ops | Easy | Harder | Built-in |
| Debugging | Clear | Moderate | Complex |
| Token handling | Direct | Direct | RTK magic |
| Caching | Manual | Manual | Automatic |
| Real-time updates | Manual | Manual | Built-in |

**When to use Plain Thunks** (this project):
- ✅ Multiple independent operations per slice
- ✅ JWT token management
- ✅ Complex loading states (list vs detail vs update)
- ✅ Team prefers explicit patterns

**When to consider RTK Query**:
- ✅ Mostly CRUD operations
- ✅ Extensive caching needs
- ✅ Real-time data synchronization
- ✅ Smaller learning curve for RTK users

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

### Advanced Pattern: User Management Slice

For complex slices with multiple operations, use **Start/Success/Error reducers**:

```tsx
// userManagementSlice.ts
const userManagementSlice = createSlice({
  name: "userManagement",
  initialState: {
    users: [],
    pagination: { page: 1, limit: 20, total: 0, hasMore: false, totalPages: 0 },
    loading: false,
    selectedUserLoading: false,
    updating: false,
    error: null,
    selectedUserError: null,
    updateError: null,
    successMessage: null,
  },
  reducers: {
    // Get all users - Start/Success/Error pattern
    getAllUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getAllUsersSuccess: (state, action: PayloadAction<GetAllUsersResponse>) => {
      state.loading = false;
      state.users = action.payload.users;
      state.pagination = action.payload.pagination;
    },
    getAllUsersError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Get user by ID - Start/Success/Error pattern
    getUserByIdStart: (state) => {
      state.selectedUserLoading = true;
      state.selectedUserError = null;
    },
    getUserByIdSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.selectedUserLoading = false;
      state.selectedUser = action.payload;
    },
    getUserByIdError: (state, action: PayloadAction<string>) => {
      state.selectedUserLoading = false;
      state.selectedUserError = action.payload;
    },

    // Update user - Start/Success/Error pattern
    updateUserStart: (state) => {
      state.updating = true;
      state.updateError = null;
    },
    updateUserSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.updating = false;
      state.successMessage = "User updated successfully";
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    updateUserError: (state, action: PayloadAction<string>) => {
      state.updating = false;
      state.updateError = action.payload;
    },

    // Utility reducers
    clearError: (state) => {
      state.error = null;
      state.selectedUserError = null;
      state.updateError = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
});

export const {
  getAllUsersStart,
  getAllUsersSuccess,
  getAllUsersError,
  getUserByIdStart,
  getUserByIdSuccess,
  getUserByIdError,
  updateUserStart,
  updateUserSuccess,
  updateUserError,
  clearError,
  clearSuccessMessage,
} = userManagementSlice.actions;
```

**Thunk Pattern for User Management:**

```tsx
export function getAllUsers(params: PaginationParams) {
  return async function (dispatch: Dispatch) {
    dispatch(getAllUsersStart());
    try {
      const response = await axiosInstance.get<ApiResponse<any>>(
        USER_MANAGEMENT_ENDPOINTS.GET_ALL_USERS,
        { params },
      );
      const { users, pagination } = response.data.data;
      dispatch(
        getAllUsersSuccess({
          users,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            hasMore: pagination.hasMore,
            totalPages: pagination.totalPages,
          },
        }),
      );
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to fetch users";
      dispatch(getAllUsersError(message));
      toast.error(message);
    }
  };
}

export function updateUser(userId: string, data: UpdateProfilePayload) {
  return async function (dispatch: Dispatch) {
    dispatch(updateUserStart());
    try {
      const response = await axiosInstance.put<ApiResponse<UserProfile>>(
        USER_MANAGEMENT_ENDPOINTS.UPDATE_USER(userId),
        data,
      );
      dispatch(updateUserSuccess(response.data.data));
      toast.success("User updated!");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to update user";
      dispatch(updateUserError(message));
      toast.error(message);
    }
  };
}
```

**Usage in Components:**

```tsx
const dispatch = useAppDispatch();
const { users, loading, error, updating } = useAppSelector(state => state.userManagement);

// Load users on mount
useEffect(() => {
  dispatch(getAllUsers({ page: 1, limit: 20 }));
}, []);

// Update user
const handleUpdate = (userId: string, newData: UpdateProfilePayload) => {
  dispatch(updateUser(userId, newData));
  // Success/error handled by toast
};
```

#### Why Start/Success/Error Pattern?

✅ **Separate loading states** for different operations
✅ **Fine-grained error tracking** (which operation failed)
✅ **Optimistic UI updates** (update list immediately)
✅ **Better user feedback** (individual operation status)
✅ **Complex workflows** (some ops fast, some slow)

**Use Cases**:
- Admin pages with multiple operations (list, view, edit, delete)
- Pages with dependent data loads
- Complex forms with multiple submission types

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

### Pattern 0: Creating a New Redux Slice (Plain Thunks)

When creating a new feature like Letters, follow this template:

**File Structure**:
```
store/slices/
├── letterSlice.ts       # State + reducers
└── (thunks inline or separate file)
```

**Template** (letterSlice.ts):

```tsx
import { createSlice } from "@reduxjs/toolkit";
import type { Dispatch, PayloadAction } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";
import { toast } from "sonner";

// Types
export interface Letter {
  id: string;
  subject: string;
  content: string;
  author: { id: string; fullName: string };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface LetterState {
  letters: Letter[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  loading: boolean;
  creating: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: LetterState = {
  letters: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  creating: false,
  error: null,
  successMessage: null,
};

// Slice
const letterSlice = createSlice({
  name: "letters",
  initialState,
  reducers: {
    // Start/Success/Error reducers
    getLettersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    getLettersSuccess: (state, action: PayloadAction<{
      letters: Letter[];
      pagination: typeof initialState.pagination;
    }>) => {
      state.loading = false;
      state.letters = action.payload.letters;
      state.pagination = action.payload.pagination;
    },
    getLettersError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    createLetterStart: (state) => {
      state.creating = true;
      state.error = null;
    },
    createLetterSuccess: (state, action: PayloadAction<Letter>) => {
      state.creating = false;
      state.letters.unshift(action.payload);
      state.successMessage = "Letter created!";
    },
    createLetterError: (state, action: PayloadAction<string>) => {
      state.creating = false;
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.successMessage = null;
    },
  },
});

export const {
  getLettersStart,
  getLettersSuccess,
  getLettersError,
  createLetterStart,
  createLetterSuccess,
  createLetterError,
  clearError,
  clearSuccess,
} = letterSlice.actions;

export default letterSlice.reducer;

// Thunks (Plain Redux thunks - NOT createAsyncThunk)
export function getLetters(page = 1) {
  return async function (dispatch: Dispatch) {
    dispatch(getLettersStart());
    try {
      const response = await axiosInstance.get("/letters", {
        params: { page, limit: 20 },
      });
      const { letters, pagination } = response.data.data;
      dispatch(getLettersSuccess({ letters, pagination }));
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to load letters";
      dispatch(getLettersError(message));
      toast.error(message);
    }
  };
}

export function createLetter(data: { subject: string; content: string }) {
  return async function (dispatch: Dispatch) {
    dispatch(createLetterStart());
    try {
      const response = await axiosInstance.post("/letters", data);
      const letter = response.data.data;
      dispatch(createLetterSuccess(letter));
      toast.success("Letter created!");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Failed to create letter";
      dispatch(createLetterError(message));
      toast.error(message);
    }
  };
}
```

**Key Points**:
1. ✅ Use `createSlice` for state + reducers
2. ✅ Create Start/Success/Error reducer triplets
3. ✅ Use plain functions that return async functions
4. ✅ Dispatch reducers manually with `dispatch()`
5. ✅ Handle errors with try-catch
6. ✅ Call toast.error/success in thunks
7. ❌ Don't use `createAsyncThunk`
8. ❌ Don't use `extraReducers` with async thunks

---

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
      // dispatch() returns the thunk function result
      // No .unwrap() needed with plain thunks
      await dispatch(deleteItem(deleteConfirm.id));
      setDeleteConfirm(null);
      // Toast handled by thunk
    } catch (error) {
      // Error toast handled by thunk
      console.error("Delete failed:", error);
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
      // dispatch() returns thunk function result
      // Plain thunk throws on error, succeeds on success
      await dispatch(somethingThunk(data));
      // Toast handled by thunk, or:
      toast.success("Success!");
      navigate("/somewhere");
    } catch (err) {
      // Toast handled by thunk, or handle manually:
      const message = err?.response?.data?.error?.message || "Something went wrong";
      toast.error(message);
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
