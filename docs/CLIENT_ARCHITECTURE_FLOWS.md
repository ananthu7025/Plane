# PlaneAndProp Client - Architecture & Flows

**Document**: Visual flows and architecture diagrams for the React client
**Last Updated**: May 18, 2026

---

## 1. Application Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PlaneAndProp Client                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Components Layer                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │  Auth Pages     │  │  Admin Pages    │               │   │
│  │  │  - Login        │  │  - Students     │               │   │
│  │  │  - SignUp       │  │  - Mentors      │               │   │
│  │  │  - Email Verify │  │  - Roles        │               │   │
│  │  │  - Reset Pass   │  │  - Users        │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                           │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │         Reusable Component Library                │ │   │
│  │  │  ┌─────────────────┐  ┌──────────────────────┐   │ │   │
│  │  │  │ Shared Comps    │  │ Admin-Specific Comps │   │ │   │
│  │  │  │ - StatCard      │  │ - Permission Checkbox│   │ │   │
│  │  │  │ - SearchFilter  │  │ - Status Badge       │   │ │   │
│  │  │  │ - Pagination    │  │                      │   │ │   │
│  │  │  │ - TableActions  │  │                      │   │ │   │
│  │  │  │ - DeleteDialog  │  │                      │   │ │   │
│  │  │  └─────────────────┘  └──────────────────────┘   │ │   │
│  │  │                                                    │ │   │
│  │  │  ┌────────────────────────────────────────────┐  │ │   │
│  │  │  │  Input Components (React Hook Form)        │  │ │   │
│  │  │  │  - InputText (email, password, tel)        │  │ │   │
│  │  │  │  - InputTextarea                           │  │ │   │
│  │  │  │  - InputCheckbox                           │  │ │   │
│  │  │  │  - InputSelect                             │  │ │   │
│  │  │  │  - PasswordInputField (with toggle)        │  │ │   │
│  │  │  │  - ConfirmPasswordField                     │  │ │   │
│  │  │  │  - OtpInputField                           │  │ │   │
│  │  │  └────────────────────────────────────────────┘  │ │   │
│  │  │                                                    │ │   │
│  │  │  ┌────────────────────────────────────────────┐  │ │   │
│  │  │  │  Base UI Components (shadcn/Radix)        │  │ │   │
│  │  │  │  - Card, Badge, Button, Dialog            │  │ │   │
│  │  │  │  - DropdownMenu, Select, Tabs             │  │ │   │
│  │  │  └────────────────────────────────────────────┘  │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       Redux State Management Layer                       │   │
│  │  ┌──────────────────┐  ┌────────────────────────────┐  │   │
│  │  │  Auth Slice      │  │  User Management Slice     │  │   │
│  │  │  - user          │  │  - users                   │  │   │
│  │  │  - tokens        │  │  - pagination              │  │   │
│  │  │  - loading       │  │  - filters                 │  │   │
│  │  │  - error         │  │  - loading                 │  │   │
│  │  │  - successMsg    │  │                            │  │   │
│  │  └──────────────────┘  └────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌──────────────────┐  ┌────────────────────────────┐  │   │
│  │  │  Roles Slice     │  │ Redux Thunks (Async)       │  │   │
│  │  │  - roles[]       │  │ - signIn, signUp           │  │   │
│  │  │  - permissions[] │  │ - getAllUsers              │  │   │
│  │  │  - loading       │  │ - updateUserStatus         │  │   │
│  │  └──────────────────┘  │ - deleteUser               │  │   │
│  │                         │ - getAllRoles              │  │   │
│  │                         │ - assignPermission         │  │   │
│  │                         └────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Redux Persist → localStorage (auth slice only)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         HTTP & API Integration Layer                    │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Axios Client (src/api/client.ts)               │  │   │
│  │  │  - Base URL: /api                               │  │   │
│  │  │  - Request Interceptor:                         │  │   │
│  │  │    * Add Authorization header (Bearer token)    │  │   │
│  │  │  - Response Interceptor:                        │  │   │
│  │  │    * Handle 401 → Auto-refresh token retry      │  │   │
│  │  │    * Global error handling                      │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  Backend API Endpoints:                                │   │
│  │  ├── /api/auth/* (signin, signup, verify, reset)       │   │
│  │  ├── /api/users/* (get, update, delete, search)        │   │
│  │  ├── /api/admin/roles/* (get, create, update)          │   │
│  │  └── /api/admin/permissions/* (manage permissions)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Supporting Libraries                           │   │
│  │  - React Router (routing)                               │   │
│  │  - React Hook Form (form state)                         │   │
│  │  - Zod (validation schemas)                             │   │
│  │  - Framer Motion (animations)                           │   │
│  │  - Sonner (toast notifications)                         │   │
│  │  - Tailwind CSS (styling)                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Flow

### 2.1 Sign In Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  User visits /login                                             │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  LoginPage renders                                              │
│  - TwoColumnAuthLayout (hero + form)                            │
│  - React Hook Form initialized with loginSchema validation      │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  User enters email & password                                   │
│  Form validates via Zod schema:                                 │
│  - email: string().email()                                      │
│  - password: string().min(8)                                    │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  User submits form                                              │
│  onSubmit handler:                                              │
│  1. Validate (automatic via react-hook-form + zod)             │
│  2. setIsLoading(true)                                          │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Dispatch signIn thunk                                          │
│  dispatch(signIn({ email, password }))                         │
│                                                                 │
│  Thunk flow:                                                    │
│  1. Redux state: loading = true                                │
│  2. Axios POST /api/auth/signin with credentials               │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend Response: 200 OK                                       │
│  {                                                              │
│    user: { id, email, fullName, role, ... },                   │
│    accessToken: "jwt...",                                       │
│    refreshToken: "jwt..."                                       │
│  }                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  authSlice.signIn.fulfilled reducer:                            │
│  1. Save user to state                                          │
│  2. Save tokens to state                                        │
│  3. Redux Persist: Save to localStorage                         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Axios request interceptor:                                     │
│  - Next requests automatically include:                         │
│    Authorization: Bearer {accessToken}                          │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Success handling in LoginPage.onSubmit:                        │
│  1. toast.success("Logged in successfully")                     │
│  2. setIsLoading(false)                                         │
│  3. navigate(ROUTES.HOME)                                       │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Navigate to HOME                                               │
│  User is now authenticated                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Error Scenarios

```
Invalid Credentials
    ↓
Backend: 401 Unauthorized
    ↓
authSlice.signIn.rejected
    ↓
Set error state: "Invalid email or password"
    ↓
mapBackendErrorToField() tries to map to form fields
    ↓
If no field mapping, show toast.error()
    ↓
User sees error message, tries again


Token Expired (401 on any request)
    ↓
Axios response interceptor catches 401
    ↓
Attempt refreshToken call
    ↓
If refresh succeeds: Get new accessToken, retry original request
    ↓
If refresh fails: Logout user, redirect to /login
    ↓
Redux state cleared via logout reducer
    ↓
toast.error("Session expired, please login again")
```

### 2.3 Email Verification Flow

```
After Sign Up
    ↓
Email sent with OTP
    ↓
EmailVerificationPage renders
    ↓
User enters OTP (6 digits)
    ↓
Form validates:
- otp: string().length(6).regex(/^\d+$/)
    ↓
Dispatch verifyEmail thunk
    ↓
POST /api/auth/verify-email with OTP
    ↓
Success: Navigate to HOME
Error: Show "Invalid OTP" message
    ↓
Can click "Resend OTP"
    ↓
ResendOtpSection:
- Show countdown timer (60s)
- Disable resend button during countdown
- POST /api/auth/resend-otp
    ↓
New OTP sent, countdown restarts
```

---

## 3. Admin Pages - Student Management

### 3.1 AdminStudents Component Flow

```
┌────────────────────────────────────────────────────────────────┐
│  AdminStudents mounts                                          │
└────────────┬───────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────────────┐
│  useEffect #1: Fetch students on mount/filter change           │
│  Dependencies: dispatch, filters.page, filters.limit, filters  │
│  Dispatch: getAllUsers({                                       │
│    page: filters.page || 1,                                    │
│    limit: filters.limit || 20,                                 │
│    role: "STUDENT",                                            │
│    search: searchQuery,                                        │
│    status: statusFilter,                                       │
│  })                                                            │
└────────────┬───────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────────────┐
│  Redux userManagement slice:                                   │
│  - Set loading = true                                          │
│  - Axios GET /api/users with params                            │
│  - Response: { users[], pagination }                           │
│  - Set loading = false                                         │
│  - Save users, pagination to state                             │
└────────────┬───────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────────────┐
│  Render Layout:                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Header: "Students" + Export button                       │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Stats: 4 × StatCard                                      │ │
│  │  ├─ Total Students (Users icon)                          │ │
│  │  ├─ Active (CheckCircle icon)                            │ │
│  │  ├─ Inactive (Clock icon)                                │ │
│  │  └─ Suspended (Ban icon)                                 │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ SearchFilterBar:                                         │ │
│  │  ├─ Search input (triggers filter on Enter/Click Search) │ │
│  │  └─ Status filter dropdown (All/Active/Inactive/Suspend) │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Table: Students list                                     │ │
│  │ Columns: Name | Email | Status | Joined | Actions       │ │
│  │ Each row:                                                │ │
│  │  - Avatar with fallback initials                         │ │
│  │  - StatusBadgeDropdown (change status with API call)     │ │
│  │  - TableActionButtons (View/Edit/Delete icons)           │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ PaginationControls:                                      │ │
│  │  - Previous/Next buttons                                 │ │
│  │  - "Page X of Y" indicator                               │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────┬───────────────────────────────────────────────────┘
             ↓
    User Interactions...
```

### 3.2 User Actions in AdminStudents

#### Action: Change Status

```
User clicks StatusBadgeDropdown on a student row
    ↓
StatusBadgeDropdown component:
1. Show dropdown with 3 options: ACTIVE, INACTIVE, SUSPENDED
2. User selects new status
    ↓
handleStatusChange(userId, newStatus)
    ↓
Dispatch updateUserStatus(userId, newStatus)
    ↓
userManagementSlice: Set loading = true
    ↓
Axios PUT /api/users/{userId}/status
    ↓
Backend updates user status
    ↓
Response: Updated user object
    ↓
userManagementSlice:
- Update user in users[] array
- Set loading = false
    ↓
useEffect #1 dependency triggers refetch (because filters depend on users state)
OR
Redux state updated, component re-renders with new status badge color
    ↓
toast.success("Status updated") (via useEffect watching successMessage)
```

#### Action: View/Edit Student

```
User clicks "View" or "Edit" icon
    ↓
TableActionButtons onClick handlers
    ↓
Set selectedUserId and selectedUserMode ("view" or "edit")
    ↓
UserDetailModal mounts with:
- userId prop
- onClose callback
- initialMode prop
    ↓
UserDetailModal:
1. Fetch user details (if needed)
2. Initialize form with InputText/InputTextarea
   - fullName
   - bio
   - phone
   - city
   - country
3. If mode="view": Set disabled={true}
   If mode="edit": Allow form submission
    ↓
If mode="edit" and user submits:
    ↓
Dispatch updateUserProfile(data)
    ↓
Backend updates user
    ↓
toast.success("Profile updated")
    ↓
Modal closes, AdminStudents re-renders
```

#### Action: Delete Student

```
User clicks "Delete" icon on student row
    ↓
setDeleteConfirm({ userId, email })
    ↓
DeleteConfirmDialog renders with:
- title="Delete Student"
- itemName={email}
- onConfirm={handleDelete}
    ↓
User sees: "Are you sure you want to delete [email]?"
With buttons: [Delete] [Cancel]
    ↓
If user clicks Cancel:
    ↓
setDeleteConfirm(null) → Modal closes
    ↓
If user clicks Delete:
    ↓
handleDelete():
1. setIsDeleting(true)
2. Dispatch deleteUser(userId)
3. Wait for response
4. setIsDeleting(false)
    ↓
deleteUser thunk:
- DELETE /api/users/{userId}
- Remove user from users[] array
    ↓
Success:
- Modal closes
- setDeleteConfirm(null)
- toast.success("Student deleted")
- Table re-renders without deleted student
    ↓
Error:
- toast.error(message)
- Modal stays open for retry
```

---

## 4. Admin Pages - Roles & Permissions

### 4.1 AdminRoles Component Flow

```
┌────────────────────────────────────────────────────────────────┐
│  AdminRoles mounts                                             │
└────────────┬───────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────────────┐
│  useEffect: Fetch roles and permissions                        │
│  Dispatch:                                                     │
│  - getAllRoles()                                               │
│  - getAllPermissions()                                         │
└────────────┬───────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────────────┐
│  Redux rolesSlice:                                             │
│  - Fetch all roles with userCount and permissions nested       │
│  - Fetch all permissions (100+)                                │
│  - Store in state.roles and state.permissions                  │
└────────────┬───────────────────────────────────────────────────┘
             ↓
┌────────────────────────────────────────────────────────────────┐
│  Render Layout:                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Header: "Roles & Access"                                 │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Stats: 2 × StatCard                                      │ │
│  │  ├─ Total Roles (Shield icon, variant="primary")         │ │
│  │  └─ Permissions (Key icon, variant="warning")            │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Roles Grid (2 columns):                                  │ │
│  │ For each role:                                           │ │
│  │  ┌─────────────────────────────────────────────┐         │ │
│  │  │ Role Card (Card component)                  │         │ │
│  │  ├─────────────────────────────────────────────┤         │ │
│  │  │ Name: ADMIN                                 │         │ │
│  │  │ Description: Manages everything             │         │ │
│  │  │ More button (DropdownMenu) → Edit Perms     │         │ │
│  │  ├─────────────────────────────────────────────┤         │ │
│  │  │ Badge: 15 users                             │         │ │
│  │  │ Badge: 24 permissions                       │         │ │
│  │  ├─────────────────────────────────────────────┤         │ │
│  │  │ First 5 permissions as badges:              │         │ │
│  │  │ [users.create] [users.read] [users.update]  │         │ │
│  │  │ [users.delete] [posts.create]               │         │ │
│  │  │ [+19 more]                                  │         │ │
│  │  └─────────────────────────────────────────────┘         │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────┬───────────────────────────────────────────────────┘
             ↓
    User Interactions...
```

### 4.2 Edit Permissions Flow

```
User clicks Edit Permissions on a role card
    ↓
openEditRole(role) handler:
1. setEditingRole(role)
2. setRoleFormPermissions(role.permissions.map(p => p.id))
3. setIsRoleDialogOpen(true)
    ↓
Dialog opens with:
┌──────────────────────────────────────────┐
│ Edit Role Permissions                    │
│ Role: ADMIN                              │
│ Description: Manages everything          │
├──────────────────────────────────────────┤
│ Permissions                              │
│                                          │
│ [USERS MODULE]                           │
│ ☑ users.create                           │
│ ☑ users.read                             │
│ ☑ users.update                           │
│ ☑ users.delete                           │
│                                          │
│ [POSTS MODULE]                           │
│ ☑ posts.create                           │
│ ☑ posts.read                             │
│ ☑ posts.update                           │
│ ☑ posts.delete                           │
│                                          │
│ [ROLES MODULE]                           │
│ ☑ roles.read                             │
│ ☑ roles.manage                           │
│                                          │
│           [Close]                        │
└──────────────────────────────────────────┘
    ↓
User toggles a permission checkbox
e.g., Unchecks "posts.create"
    ↓
togglePermissionCheckbox(permissionId) handler:
1. Update local state: setRoleFormPermissions(prev => [...])
2. Check if permission was already assigned
3. If yes: Dispatch removePermissionFromRole(roleId, permissionId)
   If no: Dispatch assignPermissionToRole(roleId, permissionId)
    ↓
rolesSlice async thunk:
- rolesSlice.removePermissionFromRole
- DELETE /api/admin/roles/{roleId}/permissions/{permissionId}
- Backend removes permission from role
- Response: Updated role object
    ↓
rolesSlice.removePermissionFromRole.fulfilled:
- Update role in roles[] array
- Update role.permissions array
    ↓
toast.success("Permission removed") (auto-shown from useEffect)
    ↓
Dialog updates with live refresh
User sees permission unchecked with updated badge count
    ↓
User can toggle more permissions
Each change sends API request immediately
    ↓
User clicks Close button
    ↓
closeRoleDialog():
1. setIsRoleDialogOpen(false)
2. setEditingRole(null)
3. setRoleFormPermissions([])
    ↓
Dialog closes
AdminRoles page shows updated role card
```

---

## 5. State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Redux Store Structure                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ auth                                                   │   │
│  │  ├─ user: { id, email, fullName, role }              │   │
│  │  ├─ tokens: { accessToken, refreshToken }            │   │
│  │  ├─ loading: boolean                                 │   │
│  │  ├─ error: string | null                             │   │
│  │  └─ successMessage: string | null                    │   │
│  │                                                       │   │
│  │  Actions:                                            │   │
│  │  • signIn(credentials) → async thunk                │   │
│  │  • signUp(data) → async thunk                        │   │
│  │  • logout() → reducer (sync)                         │   │
│  │  • clearError() → reducer                            │   │
│  │  • clearSuccessMessage() → reducer                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ userManagement                                         │   │
│  │  ├─ users: [{ id, email, fullName, status, ... }]    │   │
│  │  ├─ pagination: { page, limit, total, totalPages }   │   │
│  │  ├─ filters: { search, status, role, sort, order }   │   │
│  │  ├─ loading: boolean                                 │   │
│  │  ├─ error: string | null                             │   │
│  │  └─ successMessage: string | null                    │   │
│  │                                                       │   │
│  │  Actions:                                            │   │
│  │  • getAllUsers(params) → async thunk                 │   │
│  │  • updateUserStatus(userId, status) → async          │   │
│  │  • deleteUser(userId) → async thunk                  │   │
│  │  • setFilters(filters) → reducer                     │   │
│  │  • clearError() → reducer                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ roles                                                  │   │
│  │  ├─ roles: [{                                         │   │
│  │  │   id, name, description,                           │   │
│  │  │   permissions: [{id, name, module}],               │   │
│  │  │   userCount                                        │   │
│  │  │ }]                                                 │   │
│  │  ├─ permissions: [{id, name, module, description}]   │   │
│  │  ├─ loading: boolean                                 │   │
│  │  └─ error: string | null                             │   │
│  │                                                       │   │
│  │  Actions:                                            │   │
│  │  • getAllRoles() → async thunk                        │   │
│  │  • getAllPermissions() → async thunk                 │   │
│  │  • assignPermissionToRole(roleId, permId) → async    │   │
│  │  • removePermissionFromRole(roleId, permId) → async  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Component Hierarchy Example: AdminStudents

```
AdminStudents (Page)
│
├─ Header (div)
│  └─ h1, p
│
├─ Stats Section (grid)
│  ├─ StatCard (Total)
│  ├─ StatCard (Active)
│  ├─ StatCard (Inactive)
│  └─ StatCard (Suspended)
│
├─ SearchFilterBar (shared component)
│  ├─ Search Input
│  ├─ Filter Select Dropdown
│  └─ Search Button
│
├─ Table Card
│  ├─ thead
│  │  └─ tr (headers)
│  └─ tbody
│     └─ tr (for each student)
│        ├─ td (Avatar + Name)
│        ├─ td (Email)
│        ├─ td (StatusBadgeDropdown admin component)
│        ├─ td (Joined Date)
│        └─ td (TableActionButtons shared component)
│           ├─ View icon button
│           ├─ Edit icon button
│           └─ Delete icon button
│
├─ PaginationControls (shared component)
│  ├─ Previous button
│  ├─ Page indicator
│  └─ Next button
│
├─ UserDetailModal (if selectedUserId)
│  ├─ Dialog
│  │  ├─ DialogHeader
│  │  │  └─ Title
│  │  ├─ Form
│  │  │  ├─ InputText (fullName)
│  │  │  ├─ InputTextarea (bio)
│  │  │  ├─ InputText (phone)
│  │  │  ├─ InputText (city)
│  │  │  └─ InputText (country)
│  │  └─ DialogFooter
│  │     └─ Submit/Cancel buttons
│  └─ CloseCallback
│
└─ DeleteConfirmDialog (shared component)
   ├─ Modal overlay
   ├─ Title & confirmation text
   ├─ Delete button
   └─ Cancel button
```

---

## 7. Data Flow: User Input → API → Store → UI

```
User Input Event
    ↓
Component Handler (onClick, onChange, onSubmit)
    ↓
Form Validation (React Hook Form + Zod)
    ↓
  ├─ Invalid: Show field errors
    ↓
  └─ Valid: Continue
    ↓
dispatch(asyncThunk(data))
    ↓
Redux Thunk:
├─ Set loading = true
├─ Axios request (GET/POST/PUT/DELETE)
└─ Handle response
    ↓
  ├─ Success (2xx):
  │  ├─ Parse response
  │  └─ Return data
  │     ↓
  │     reducer (fulfilled case):
  │     ├─ Update state with new data
  │     ├─ Set loading = false
  │     ├─ Set error = null
  │     └─ Set successMessage = "..."
  │        ↓
  │        useEffect watches successMessage:
  │        ├─ toast.success(message)
  │        ├─ dispatch(clearSuccessMessage())
  │        └─ Optional: navigate()
  │           ↓
  │           Component re-renders with new state
  │           ↓
  │           UI updates
  │
  └─ Error (4xx/5xx):
     ├─ Extract error details
     └─ Return rejectWithValue(error)
        ↓
        reducer (rejected case):
        ├─ Set error = message
        ├─ Set loading = false
        └─ mapBackendErrorToField() [optional]
           ├─ If field errors: form.setError(field, message)
           │  → Field shows error inline
           │
           └─ If general error: toast.error(message)
              ↓
              Component re-renders with error state
              ↓
              User sees error message
```

---

## 8. Component Reusability Patterns

```
┌────────────────────────────────────────────────────────────┐
│           Component Reuse Across Pages                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  StatCard: Used in                                        │
│  ├─ AdminStudents (4 instances)                           │
│  ├─ AdminRoles (2 instances)                              │
│  ├─ Any future dashboard/analytics page                  │
│  └─ Admin profile summary                                 │
│                                                            │
│  SearchFilterBar: Used in                                 │
│  ├─ AdminStudents                                         │
│  ├─ AdminMentors                                          │
│  ├─ Future: Products, Articles, etc.                      │
│  └─ Any paginated list with search                        │
│                                                            │
│  PaginationControls: Used in                              │
│  ├─ AdminStudents                                         │
│  ├─ AdminMentors                                          │
│  ├─ Future: Blog, Comments, etc.                          │
│  └─ Any paginated view                                    │
│                                                            │
│  TableActionButtons: Used in                              │
│  ├─ AdminStudents (View/Edit/Delete)                      │
│  ├─ AdminMentors (View/Edit/Delete)                       │
│  ├─ UserManagement (View/Edit/Delete)                     │
│  └─ Any data table with CRUD actions                      │
│                                                            │
│  DeleteConfirmDialog: Used in                             │
│  ├─ AdminStudents (Delete student)                        │
│  ├─ AdminMentors (Delete mentor)                          │
│  ├─ UserManagement (Delete user)                          │
│  └─ Any destructive action requiring confirmation         │
│                                                            │
│  StatusBadgeDropdown: Used in                             │
│  ├─ AdminStudents (user status)                           │
│  ├─ AdminMentors (user status)                            │
│  ├─ UserManagement (user status)                          │
│  └─ Any enum status selector (ACTIVE/INACTIVE/SUSPENDED)  │
│                                                            │
│  PermissionCheckboxGroup: Used in                         │
│  ├─ AdminRoles (edit role permissions)                    │
│  └─ Any permission management interface                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                Error Handling Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Backend Error Response (4xx/5xx)                          │
│       ↓                                                    │
│  Axios Response Interceptor                               │
│  ├─ Extract error.response.data                           │
│  ├─ Check status code                                     │
│  │  ├─ 401: Token expired → Attempt refresh               │
│  │  ├─ 400: Validation error → Extract field errors       │
│  │  ├─ 403: Permission denied                             │
│  │  └─ 5xx: Server error                                  │
│  └─ Pass error to calling code                            │
│       ↓                                                    │
│  Redux Thunk (rejected case)                              │
│  ├─ Extract error.response.data.message                   │
│  ├─ Extract error.response.data.errors (object)           │
│  └─ return rejectWithValue({message, errors})             │
│       ↓                                                    │
│  Reducer (rejected case)                                  │
│  ├─ state.error = payload.message                         │
│  ├─ state.loading = false                                 │
│  └─ Optional: state.fieldErrors = payload.errors          │
│       ↓                                                    │
│  Component (try-catch):                                   │
│  ├─ Specific error handling:                              │
│  │  ├─ Map backend field errors to form with             │
│  │  │  mapBackendErrorToField(error, form.setError)       │
│  │  │  → form.setError("email", "Email already exists")  │
│  │  │  → User sees inline field error                     │
│  │  │                                                     │
│  │  └─ Check for special error codes:                     │
│  │     ├─ "RESET_TOKEN_EXPIRED" → redirect to forgotpass  │
│  │     ├─ "RESET_TOKEN_USED" → redirect to login          │
│  │     └─ "NOT_FOUND" → redirect to signup               │
│  │                                                        │
│  └─ General error: toast.error(message)                   │
│                                                             │
│  useEffect (watches error state):                          │
│  ├─ If error exists:                                      │
│  │  ├─ toast.error(error)                                │
│  │  ├─ dispatch(clearError())                            │
│  │  └─ Prevent duplicate toasts                           │
│  └─ Triggered only once per error                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Key Data Structures

### User Object
```typescript
{
  id: string;                    // UUID
  email: string;                 // Unique
  fullName: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  avatarMediaId?: string;
  bio?: string;
  phone?: string;
  city?: string;
  country?: string;
  createdAt: string;             // ISO date
  updatedAt: string;
}
```

### Role Object
```typescript
{
  id: number;
  name: string;                  // "ADMIN", "MENTOR", "STUDENT"
  description: string;
  permissions: [                 // Nested permissions
    {
      id: number;
      name: string;              // "users.create"
      module: string;            // "Users"
      description: string;
    }
  ];
  userCount: number;             // Count of users with this role
}
```

### Permission Object
```typescript
{
  id: number;
  name: string;                  // "users.create"
  module: string;                // "Users", "Posts", etc.
  description: string;
}
```

### Pagination Object
```typescript
{
  page: number;                  // Current page (1-based)
  limit: number;                 // Items per page
  total: number;                 // Total items
  totalPages: number;            // Calculated total pages
}
```

---

This document provides a complete visual reference for the PlaneAndProp client architecture and data flows.
