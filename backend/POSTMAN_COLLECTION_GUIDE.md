# Postman Collection Guide - Phase 1 & 2

**Updated**: May 18, 2026
**Collection**: `Plane-Prop-API-Phase1-Phase2.postman_collection.json`
**Total Endpoints**: 15 (8 Auth + 7 User Profiles/Admin)

---

## 📥 How to Import the Collection

### Method 1: Direct Import
1. Open **Postman**
2. Click **"Import"** button in top-left
3. Select **"File"** tab
4. Choose `Plane-Prop-API-Phase1-Phase2.postman_collection.json`
5. Click **Import**

### Method 2: Via Workspace
1. In Postman: **File** → **New from file**
2. Select the collection JSON file
3. Click **Open**

---

## 🔧 Initial Setup

### 1. Set Environment Variables
After importing, Postman should auto-populate these variables. If not, set them manually:

| Variable | Value | Auto-filled By |
|----------|-------|---|
| `base_url` | `http://localhost:5000` | Manual |
| `accessToken` | *(empty)* | Signin endpoint |
| `refreshToken` | *(empty)* | Signin endpoint |
| `userId` | *(empty)* | Signin or Signup endpoint |
| `userEmail` | *(empty)* | Signup endpoint |
| `userName` | *(empty)* | Signup endpoint |
| `userRole` | *(empty)* | Signin endpoint |
| `userProfileId` | *(empty)* | GET Profile endpoint |

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
Server starts at `http://localhost:5000`

---

## 🚀 Test Workflow - Complete Authentication Flow

Follow this sequence to test the entire Phase 1 (Auth) system:

### Step 1: Signup
- **Request**: `1️⃣ Signup`
- **What it does**: Creates new user account
- **Auto-fills**: `userId`, `userEmail`, `userName`
- **Note**: Change email to unique value each time

### Step 2: Verify Email
- **Request**: `2️⃣ Verify Email`
- **What it does**: Confirms email with OTP
- **Requirements**: Must have valid OTP from email
- **Note**: If not using real email, try OTP: `123456`

### Step 3: Signin
- **Request**: `3️⃣ Signin`
- **What it does**: Login user and get tokens
- **Auto-fills**: `accessToken`, `refreshToken`, `userId`, `userRole`
- **Note**: User must be verified before signin

### Step 4: Get Profile
- **Request**: `👤 GET Own Profile` (Phase 2)
- **What it does**: Fetch authenticated user's profile
- **Uses**: `accessToken` (auto-filled from Signin)

### Step 5: Update Profile
- **Request**: `✏️ UPDATE Own Profile`
- **What it does**: Update profile information
- **Fields**: fullName, bio, phone, city, country
- **Note**: All fields are optional

### Step 6: Refresh Token (Optional)
- **Request**: `4️⃣ Refresh Token`
- **When to use**: After access token expires
- **Auto-fills**: New `accessToken` and `refreshToken`

### Step 7: Signout
- **Request**: `5️⃣ Signout`
- **What it does**: Logout and revoke tokens
- **Clears**: `accessToken`, `refreshToken`, `userId`

---

## 👨‍💼 Admin Testing Workflow

To test admin endpoints, you need an ADMIN user:

### Prerequisites
1. Signup/Signin as regular user (STUDENT)
2. Database update: Manually change user's role in database to ADMIN
   ```sql
   UPDATE users SET role_id = 3 WHERE email = 'admin@example.com';
   ```
3. Signin again to get new token with ADMIN role

### Admin Endpoints
1. **📊 LIST All Users**
   - Lists all users with pagination
   - Try filters: `status=SUSPENDED`, `role=STUDENT`

2. **🔍 GET User (Admin)**
   - Get any user's full profile
   - Replace `USER_ID_HERE` with actual UUID
   - Tip: Copy UUID from user list response

3. **✏️ UPDATE User Profile (Admin)**
   - Edit any user's profile
   - Replace `USER_ID_HERE` with actual UUID

4. **🚫 CHANGE User Status (Admin)**
   - Change user status (ACTIVE/INACTIVE/SUSPENDED)
   - Replace `USER_ID_HERE` with actual UUID
   - Status options: ACTIVE, INACTIVE, SUSPENDED

---

## 📋 Collection Structure

### PHASE 1️⃣ - Authentication (8 Endpoints)
```
├── 1️⃣ Signup
├── 2️⃣ Verify Email
├── 3️⃣ Signin
├── 4️⃣ Refresh Token
├── 5️⃣ Signout
├── 6️⃣ Resend OTP
├── 7️⃣ Forgot Password
└── 8️⃣ Reset Password
```

### PHASE 2️⃣ - User Profiles (3 Endpoints)
```
├── 👤 GET Own Profile
├── ✏️ UPDATE Own Profile
└── 👥 GET Public Profile
```

### PHASE 2️⃣ - Admin Management (4 Endpoints)
```
├── 📊 LIST All Users
├── 🔍 GET User (Admin)
├── ✏️ UPDATE User Profile (Admin)
└── 🚫 CHANGE User Status (Admin)
```

---

## 🔍 Key Features of the Collection

### ✅ Auto-saving Variables
Each endpoint has a `test` script that automatically saves responses to variables:

- **Signup**: Saves userId, userEmail, userName
- **Signin**: Saves accessToken, refreshToken, userId, userRole
- **Refresh**: Updates accessToken and refreshToken
- **Get Profile**: Saves userProfileId

### ✅ Console Logging
Endpoints log meaningful messages to Postman console:

```
✅ User created: 123e4567-e89b-12d3-a456-426614174000
📧 Check email for OTP: user@example.com
✅ Signed in as: user@example.com
🔐 Access Token: eyJhbGciOiJIUzI1NiIs...
```

To view: **View** → **Show Postman Console** (or Ctrl+Alt+C)

### ✅ Dynamic Variables
Use `{{variable_name}}` to reference saved values:

- `{{base_url}}` - Server address
- `{{accessToken}}` - JWT access token
- `{{userId}}` - Current user ID
- `{{userEmail}}` - Current user email

### ✅ Pre-filled Examples
All request bodies have realistic example values. Modify as needed.

---

## 🔐 Authorization

### Bearer Token Format
Admin endpoints require Bearer token authorization:

```
Authorization: Bearer {{accessToken}}
```

This is automatically included in the request headers where needed.

### Token Expiry
- **Access Token**: 1 minute
- **Refresh Token**: 7 days

When access token expires, use **Refresh Token** endpoint to get new one.

---

## 📊 Response Examples

### Success Response (200/201)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "error": null,
  "timestamp": "2026-05-18T10:35:00Z"
}
```

### Error Response (400/403/404)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "validation": "email"
    }
  },
  "timestamp": "2026-05-18T10:35:00Z"
}
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Unauthorized" (401)
**Cause**: Missing or invalid access token
**Solution**:
1. Signin again (Endpoint 3)
2. Verify token is set in environment variables
3. Check token hasn't expired (valid for 1 minute)

### Issue: "Forbidden" (403)
**Cause**: Trying to access admin endpoint without ADMIN role
**Solution**:
1. Verify user has ADMIN role in database
2. Signin again to get new token with ADMIN role
3. Check `{{userRole}}` variable is "ADMIN"

### Issue: "User not found" (404)
**Cause**: User ID doesn't exist
**Solution**:
1. Verify UUID is correct
2. Get valid UUID from user list endpoint
3. Copy exact UUID (no typos)

### Issue: "Email already registered" (409)
**Cause**: Trying to signup with existing email
**Solution**:
1. Use unique email address (e.g., add timestamp)
2. Or use Forgot Password to reset existing account

### Issue: Token not auto-filling
**Cause**: Test scripts didn't run or response was error
**Solution**:
1. Check Response tab shows 200/201 status
2. Review error message in response
3. Check Postman Console for script errors

---

## 💡 Tips for Testing

### 1. Use Same Browser Session
Keep same environment throughout testing:
- Signup → Verify → Signin → Get Profile → Update Profile

### 2. Copy UUIDs Carefully
When testing admin endpoints:
1. Run "LIST All Users"
2. Find user in response
3. Copy UUID (without quotes)
4. Paste into URL of next request

### 3. Change Test Data
For signup tests, change email each time:
```json
{
  "email": "user.{{$timestamp}}@example.com",
  "password": "SecurePass123!",
  "full_name": "Test User"
}
```

### 4. Review Actual Responses
Always check:
- Response status code (should be 200/201)
- Response body in "Pretty" tab
- Error messages if status is 4xx/5xx

### 5. Use Console Tab
Click **Console** at bottom to see:
- Logged messages from test scripts
- Request/response details
- JavaScript errors

---

## 🔄 Workflow Examples

### Example 1: Full Auth & Profile Flow
1. Signup (creates user) → 2. Verify Email → 3. Signin (get tokens) → 4. Get Profile → 5. Update Profile

### Example 2: Test Token Refresh
1. Signin → 2. Wait 2 minutes → 3. Refresh Token → 4. Get Profile (with new token)

### Example 3: Admin User Management
1. Signin as ADMIN → 2. List Users → 3. Copy User UUID → 4. Get User Details → 5. Update User Status

---

## 📞 Troubleshooting Checklist

Before reporting issues:
- [ ] Backend server is running (`npm run dev`)
- [ ] Base URL is correct (`http://localhost:5000`)
- [ ] Email is unique (for signup)
- [ ] OTP is valid (check email or use 123456 for test)
- [ ] Token hasn't expired (signin again if >1 min)
- [ ] User has required role (ADMIN for admin endpoints)
- [ ] Database is running and tables exist
- [ ] Check Postman Console for detailed errors

---

## 🚀 Next Steps

After testing Phase 1 & 2:
1. Review API documentation in PHASE2_USER_PROFILES.md
2. Start Phase 3 - Community Posts (coming soon)
3. Build frontend integration with Redux thunks
4. Set up automated API tests

---

**Status**: ✅ Collection Complete - Ready for Testing
**Last Updated**: May 18, 2026
