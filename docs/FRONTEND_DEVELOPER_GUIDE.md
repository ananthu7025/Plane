# Frontend Developer Guide

**PlaneAndProp Frontend** • React 18 + Redux Toolkit + TypeScript + Tailwind CSS

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Code Standards](#code-standards)
4. [Redux & State Management](#redux--state-management)
5. [Component Patterns](#component-patterns)
6. [Hooks & Custom Hooks](#hooks--custom-hooks)
7. [Error Handling](#error-handling)
8. [Type Safety](#type-safety)
9. [API Integration](#api-integration)
10. [Do's and Don'ts](#dos-and-donts)

---

## Architecture Overview

The frontend uses **Redux Toolkit** for state management with **async thunks** for API calls.

### Data Flow

```
Component
    ↓
useAppDispatch() ← dispatch thunk
    ↓
Redux Thunk (API call)
    ↓
Axios instance (with interceptors)
    ↓
Backend API
    ↓
Response → fulfilled/rejected reducer
    ↓
useAppSelector() ← read from Redux store
    ↓
Component re-renders
```

### State Management Layers

| Layer | Responsibility | Tools |
|-------|-----------------|-------|
| **Components** | Render UI, handle user interactions | React, hooks |
| **Redux Slices** | Manage state (UI + data), define thunks | @reduxjs/toolkit |
| **Async Thunks** | Call API, handle loading/error states | createAsyncThunk |
| **Axios Client** | HTTP requests, auth token injection, refresh logic | Axios instance |
| **Error Handler** | Normalize errors, retry logic, logging | errorHandler.ts |

---

## Project Structure

```
client/src/
├── pages/                      # Page components (route-level)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── EmailVerificationPage.tsx
│   │   └── ForgotPasswordPage.tsx
│   ├── student/
│   │   ├── StudentDashboard.tsx
│   │   ├── Newsletters.tsx
│   │   └── Letters.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminNewsletters.tsx
│       ├── AdminLetters.tsx
│       └── AdminStudents.tsx
├── components/
│   ├── ui/                     # shadcn/ui components (pre-built)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ... (50+ components)
│   ├── auth/                   # Auth-specific components
│   │   ├── buttons/
│   │   ├── layouts/
│   │   ├── sections/
│   │   └── constants.ts
│   ├── community/              # Community feature components
│   │   ├── PostCard.tsx
│   │   ├── ReplyItem.tsx
│   │   ├── CreatePostDialog.tsx
│   │   └── index.ts
│   ├── layout/                 # Layout components
│   │   ├── AdminLayout.tsx
│   │   ├── StudentLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   └── StudentSidebar.tsx
│   ├── admin/                  # Admin-specific components
│   │   ├── UserDetailModal.tsx
│   │   ├── StatusBadgeDropdown.tsx
│   │   └── PermissionCheckboxGroup.tsx
│   ├── common/                 # Shared components
│   │   ├── ProtectedRoute.tsx
│   │   ├── AuthOnlyRoute.tsx
│   │   └── ErrorBoundary.tsx
│   └── shared/                 # Reusable components
│       ├── PaginationControls.tsx
│       ├── SearchFilterBar.tsx
│       ├── DeleteConfirmDialog.tsx
│       └── StatCard.tsx
├── store/
│   ├── index.ts                # Store configuration
│   └── slices/                 # Redux slices
│       ├── authSlice.ts        # Auth state (user, tokens)
│       ├── communitySlice.ts   # Community state (posts, comments)
│       ├── letterSlice.ts      # Letter state
│       ├── newsletterSlice.ts  # Newsletter state
│       ├── rolesSlice.ts       # Roles & permissions
│       └── userManagementSlice.ts  # Admin user management
├── hooks/
│   ├── redux.ts                # Typed useAppDispatch, useAppSelector
│   ├── useAuth.ts              # Auth hook (current user)
│   ├── useErrorHandler.ts      # Error handling hook
│   ├── useNewsletterFilters.ts # Newsletter filters logic
│   ├── useInfiniteScroll.ts    # Infinite scroll hook
│   └── use-mobile.tsx          # Mobile detection
├── lib/
│   ├── utils.ts                # Utility functions
│   ├── constants.ts            # App-wide constants
│   ├── communityConstants.ts   # Community-specific constants
│   └── errorHandler.ts         # Error normalization & logging
├── api/
│   ├── client.ts               # Axios instance + interceptors
│   └── endpoints.ts            # API endpoint constants
├── types/
│   ├── auth.ts                 # Auth types
│   ├── newsletter.ts           # Newsletter types
│   └── community.ts            # Community types
├── App.tsx                     # Root component
└── main.tsx                    # App entry point
```

### Key Principles

- **One responsibility per file** - Components do one thing
- **Logical feature grouping** - Related components in folders
- **Separation of UI and logic** - Components vs hooks vs services
- **Centralized state** - All data in Redux (not scattered in useState)
- **Reusable components** - Extract common patterns into shared components

---

## Code Standards

### 1. File Naming

```
✅ DO:
- LoginPage.tsx            (PascalCase for React components)
- useAuth.ts               (camelCase starting with "use" for hooks)
- PostCard.tsx             (PascalCase for components)
- authSlice.ts             (camelCase for non-component files)
- constants.ts             (lowercase, descriptive)
- errorHandler.ts          (camelCase)

❌ DON'T:
- login-page.tsx           (kebab-case for React files)
- LoginPage.ts             (Components must be .tsx)
- useauth.ts               (Missing capital after 'use')
- POST_CARD.tsx            (UPPER_CASE for components)
- page.tsx                 (Too generic)
```

### 2. Component Structure

**Functional Components with Hooks**:

```typescript
✅ DO:
interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const dispatch = useAppDispatch();
  const [showReplies, setShowReplies] = useState(false);

  const handleDelete = async () => {
    await dispatch(deletePost(post.id));
    onDelete?.(post.id);
  };

  return (
    <div className="post-card">
      {/* JSX */}
    </div>
  );
}

❌ DON'T:
// Class components (use functional + hooks)
class PostCard extends React.Component {

// Missing prop types
export function PostCard(props) {

// Untyped props
export function PostCard(props: any) {

// No JSX return type annotation
export function PostCard(props) {
  return <>...</>;
}
```

### 3. Type Annotations

```typescript
✅ DO:
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const [user, setUser] = useState<UserProfile | null>(null);

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

❌ DON'T:
const [user, setUser] = useState(null);  // Missing type

interface UserProfile {
  id: string;
  name: any;  // Avoid any
  email: any;
}

function getInitials(name) {  // Missing type
```

### 4. JSDoc for Complex Functions

```typescript
✅ DO:
/**
 * Format date for display
 * @param date - ISO date string
 * @param format - Format pattern (e.g., "MM/DD/YYYY")
 * @returns Formatted date string
 */
export function formatDate(date: string, format: string = "MMM DD, YYYY"): string {
  // ...
}

❌ DON'T:
export function formatDate(date: string, format: string = "MMM DD, YYYY"): string {
  // Missing JSDoc
}
```

---

## Redux & State Management

### Slice Structure

```typescript
// store/slices/communitySlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "@/api/client";

// 1. Define state interface
interface CommunityState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; total: number };
}

// 2. Define initial state
const initialState: CommunityState = {
  posts: [],
  loading: false,
  error: null,
  pagination: { page: 1, total: 0 },
};

// 3. Define async thunks
export const getPostFeed = createAsyncThunk(
  "community/getPostFeed",
  async (
    { page = 1, limit = 20 }: { page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.get("/community/posts", {
        params: { page, limit },
      });
      return response.data.data;  // Extract data from response
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// 4. Define slice
const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPostFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPostFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(getPostFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = normalizeError(action.payload).message;
      });
  },
});

export default communitySlice.reducer;
export const { clearError } = communitySlice.actions;
```

### Thunk Pattern

```typescript
✅ DO:
export const createPost = createAsyncThunk(
  "community/createPost",
  async (
    { title, content, categoryId }: CreatePostInput,
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post("/community/posts", {
        title,
        content,
        categoryId,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

❌ DON'T:
export const createPost = createAsyncThunk(
  "community/createPost",
  async (data: CreatePostInput) => {
    // Missing error handling
    const response = await axiosInstance.post("/community/posts", data);
    return response.data;  // Returning raw response
  }
);
```

### Using Thunks in Components

```typescript
✅ DO:
export function PostList() {
  const dispatch = useAppDispatch();
  const { posts, loading, error } = useAppSelector(state => state.community);

  useEffect(() => {
    dispatch(getPostFeed({ page: 1, limit: 20 }));  // No 'as any'!
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

❌ DON'T:
// Using 'as any' to ignore promise type
await dispatch(getPostFeed({ page: 1 }) as any);

// Missing error handling
const { posts } = useAppSelector(state => state.community);

// Not using loading state
const [isLoading, setIsLoading] = useState(false);
```

### Properly Typing Thunk Dispatch

**IMPORTANT**: The problem with `as any` casts comes from async thunks. Here's the proper solution:

```typescript
// ✅ SOLUTION: Create a wrapper function in hooks/redux.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Now in components:
const dispatch = useAppDispatch();  // ← Properly typed
dispatch(getPostFeed({ page: 1 }));  // ← No 'as any' needed!

// The dispatch automatically knows the thunk returns a promise
// and properly types the result
```

---

## Component Patterns

### Pattern 1: Page Component

```typescript
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { getPostFeed } from "@/store/slices/communitySlice";
import { PostCard } from "@/components/community";
import { PaginationControls } from "@/components/shared";

export function CommunityPage() {
  const dispatch = useAppDispatch();
  const { posts, loading, pagination } = useAppSelector(
    state => state.community
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getPostFeed({ page, limit: 20 }));
  }, [page, dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      <PaginationControls
        current={page}
        total={pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Pattern 2: Modal Component

```typescript
interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  onPostCreated,
}: CreatePostDialogProps) {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector(state => state.community);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  });

  const onSubmit = async (data: CreatePostInput) => {
    try {
      setIsSubmitting(true);
      const result = await dispatch(createPost(data));

      if (createPost.fulfilled.match(result)) {
        form.reset();
        onOpenChange(false);
        onPostCreated?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 3: List Component with Loading

```typescript
interface PostListProps {
  categoryId?: number;
}

export function PostList({ categoryId }: PostListProps) {
  const dispatch = useAppDispatch();
  const { posts, loading } = useAppSelector(state => state.community);

  useEffect(() => {
    dispatch(getPostFeed({ categoryId }));
  }, [categoryId, dispatch]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No posts found
        </div>
      )}

      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

---

## Hooks & Custom Hooks

### Built-in Redux Hooks

```typescript
// ✅ Always use these from hooks/redux.ts (typed versions)
import { useAppDispatch, useAppSelector } from "@/hooks/redux";

const dispatch = useAppDispatch();
const state = useAppSelector(state => state.auth);
```

### Custom Hook Pattern

```typescript
// hooks/useAuth.ts
import { useAppSelector } from "./redux";

export function useAuth() {
  const { user, accessToken, isAuthenticated } = useAppSelector(
    state => state.auth
  );

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading: !user && isAuthenticated,  // Computed state
  };
}

// Usage:
const { user, isAuthenticated } = useAuth();
```

### Data Fetching Hook

```typescript
// hooks/useNewsletterFilters.ts
interface UseNewsletterFiltersOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function useNewsletterFilters(options: UseNewsletterFiltersOptions = {}) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(options.initialPage ?? 1);
  const [limit, setLimit] = useState(options.initialLimit ?? 20);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { items, pagination, loading } = useAppSelector(
    state => state.newsletter
  );

  useEffect(() => {
    dispatch(getNewsletters({ page, limit, search, category }));
  }, [page, limit, search, category, dispatch]);

  return {
    items,
    pagination,
    loading,
    filters: { page, limit, search, category },
    setPage,
    setSearch,
    setCategory,
  };
}
```

---

## Error Handling

### Error Handler Utility

```typescript
// lib/errorHandler.ts (already implemented)
export const errorHandler = {
  detectCode: detectErrorCode,
  normalize: normalizeError,
  log: errorLogger.log.bind(errorLogger),
  getLogs: errorLogger.getLogs.bind(errorLogger),
  clearLogs: errorLogger.clearLogs.bind(errorLogger),
  withRetry,
};

// Usage in slices:
.addCase(getPostFeed.rejected, (state, action) => {
  const error = normalizeError(action.payload);
  state.error = error.userMessage;
  state.severity = error.severity;
})
```

### Error Display Pattern

```typescript
export function ErrorAlert() {
  const { error } = useAppSelector(state => state.community);

  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

### Form Field Errors

```typescript
// Use react-hook-form with form validation
const form = useForm<SignUpInput>({
  resolver: zodResolver(signUpSchema),
});

// Field error display:
<Input
  {...form.register("email")}
  placeholder="Email"
/>
{form.formState.errors.email && (
  <p className="text-red-500 text-sm">
    {form.formState.errors.email.message}
  </p>
)}
```

---

## Type Safety

### Type Definitions

```typescript
// types/community.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  categoryId: number;
}

export type PostStatus = Post["status"];  // Extract union type
```

### Zod Validation Schemas

```typescript
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "Title required").max(200),
  content: z.string().min(1, "Content required").max(5000),
  categoryId: z.number().min(1, "Category required"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

### Never Use `as any`

```typescript
❌ DON'T:
const replyGroup = data as any;
dispatch(getPostDetails(post.id) as any);

✅ DO:
// Properly type everything
interface ReplyGroup {
  parent: Reply;
  nested: ReplyGroup[];
}

const replyGroup: ReplyGroup = data;
dispatch(getPostDetails(post.id));  // No cast needed with proper typing
```

---

## API Integration

### Axios Client Setup

```typescript
// api/client.ts
import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptors for auth, refresh token, error handling
// Already implemented - don't modify unless necessary
```

### Making API Calls

```typescript
✅ DO:
const response = await axiosInstance.get("/community/posts", {
  params: { page: 1, limit: 20 }
});

const data = response.data.data;  // Extract from response wrapper

❌ DON'T:
const response = await axiosInstance.get("/community/posts");
const data = response.data;  // Wrong - need to extract from wrapper

// Console logging in production
console.log("API response:", response);
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { /* actual response */ },
  "error": null,
  "timestamp": "2026-06-02T10:30:00Z"
}
```

---

## Styling Standards

### Tailwind CSS

```typescript
✅ DO:
<div className="flex items-center justify-between p-4 rounded-lg bg-white shadow">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <Button variant="outline">Action</Button>
</div>

❌ DON'T:
<div style={{ display: 'flex', padding: '16px' }}>
  {/* Inline styles */}
</div>

<div className="custom-style">
  {/* Custom CSS when Tailwind should be used */}
</div>
```

### Component Variants with shadcn/ui

```typescript
// shadcn/ui components support variants
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="destructive">Delete</Button>
```

---

## Do's and Don'ts

### ✅ DO

- **Use Redux for all state** - Never useState for data that persists
- **Type everything** - Use interfaces, types, and Zod schemas
- **Use useAppDispatch/useAppSelector** - Typed hooks from hooks/redux.ts
- **Extract props to interfaces** - Explicit component contracts
- **Use JSX for component logic** - Keep components pure
- **Handle loading and error states** - Show UI feedback
- **Use react-hook-form** - For form validation and submission
- **Keep components small** - Single responsibility
- **Use constants** - For strings, routes, API endpoints
- **Use error handler utility** - For error normalization
- **Validate form input** - With Zod schemas
- **Use proper TypeScript types** - Never `any`
- **Organize imports** - Group by external, internal, relative
- **Create reusable components** - Extract common patterns
- **Use dependency array in useEffect** - Prevent infinite loops

### ❌ DON'T

- **Don't use `useState` for shared data** - Use Redux instead
- **Don't use `console.log` in production** - Use error handler logger
- **Don't use `as any` casts** - Properly type instead
- **Don't fetch data in components** - Use Redux thunks
- **Don't make API calls directly** - Use axiosInstance
- **Don't bypass validation** - Always validate inputs
- **Don't hardcode values** - Use constants
- **Don't make components too large** - Split into smaller pieces
- **Don't use inline styles** - Use Tailwind CSS
- **Don't ignore errors** - Handle and display them
- **Don't disable ESLint rules** - Fix the underlying issue
- **Don't leave TODO comments** - Resolve or create GitHub issues
- **Don't mutate state directly** - Redux handles immutability
- **Don't use class components** - Use functional components with hooks
- **Don't forget accessibility** - Use semantic HTML, ARIA labels

### Data Flow Example

```typescript
// ❌ WRONG WAY:
function PostList() {
  const [posts, setPosts] = useState([]);  // Local state

  useEffect(() => {
    fetch('/api/posts')  // Direct API call
      .then(r => r.json())
      .then(data => setPosts(data));  // Manual state update
  }, []);

  return posts.map(post => <PostCard post={post} />);
}

// ✅ CORRECT WAY:
function PostList() {
  const dispatch = useAppDispatch();
  const { posts, loading } = useAppSelector(state => state.community);

  useEffect(() => {
    dispatch(getPostFeed());  // Dispatch Redux thunk
  }, [dispatch]);

  if (loading) return <Loader />;

  return posts.map(post => <PostCard key={post.id} post={post} />);
}
```

---

## Common Patterns Checklist

When building a new feature:

- [ ] Create Zod validation schema in lib/
- [ ] Define TypeScript types in types/
- [ ] Create Redux slice with thunks in store/slices/
- [ ] Create page component in pages/
- [ ] Create feature components in components/
- [ ] Create custom hook if reusable logic
- [ ] Add error handling in thunk rejected case
- [ ] Add loading state display
- [ ] Add empty state display
- [ ] Use useAppDispatch/useAppSelector (typed)
- [ ] Validate all form inputs
- [ ] Handle API errors gracefully
- [ ] No console.log statements
- [ ] No `as any` casts
- [ ] No hardcoded strings
- [ ] Proper TypeScript types everywhere

---

## Debugging Tips

### 1. Redux DevTools
Browser extension shows state changes and thunk dispatches

### 2. Error Logging
Access error logs in browser console:
```typescript
// In any component
const logs = errorHandler.getLogs();
console.log(logs);
```

### 3. Check Network Requests
Use browser DevTools Network tab to see:
- Request headers (Authorization token)
- Response status and data
- Timing information

### 4. Component Props
Verify props match interfaces:
```typescript
const { post, onDelete } = props;
// Check that post has all required fields
// Check that onDelete is defined
```

---

## Resources

- **Redux Documentation**: https://redux-toolkit.js.org/
- **React Hooks**: https://react.dev/reference/react/hooks
- **Zod Validation**: https://zod.dev/
- **React Hook Form**: https://react-hook-form.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **Error Handler**: `src/lib/errorHandler.ts`
- **Type Definitions**: `src/types/`
- **Redux Slices**: `src/store/slices/`

---

**Last Updated**: June 2, 2026
