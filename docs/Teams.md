# Microsoft Teams Meeting Integration Setup

## Objective

Integrate Microsoft Teams meeting creation into the MERN application.

Expected Flow:

1. User schedules a meeting in the web application.
2. Backend calls Microsoft Graph API.
3. Microsoft Teams meeting is created automatically.
4. Teams meeting URL is returned.
5. URL is stored in MongoDB.
6. Meeting link is displayed to participants.

---

# Azure Setup Completed

## Azure Account

Successfully created Azure account and accessed Azure Portal.

Portal:
https://portal.azure.com

---

# Microsoft Entra ID Tenant

Tenant Created:

```text
Default Directory
```

Tenant ID:

```text
6bea4f27-a3ee-4946-be9d-cf5889630eda
```

---

# Application Registration

Created App Registration:

```text
Plane and Prop
```

Application (Client) ID:

```text
73165d04-5236-48ba-956e-f7036e810afb
```

Object ID:

```text
2a3037cb-7673-4ff2-935c-ace02b48dd63
```

Supported Account Types:

```text
My organization only
```

Current Recommendation:

Change to:

```text
Accounts in any organizational directory and personal Microsoft accounts
```

This enables:

* Outlook users
* Hotmail users
* Personal Microsoft accounts
* Microsoft 365 accounts

---

# Authentication Configuration

Configured Redirect URI:

```text
http://localhost:3000/auth/callback
```

Platform Type:

```text
Web
```

Authentication Page:

```text
App Registration
→ Authentication
```

---

# Client Secret

Client Secret Created:

```text
Certificates & Secrets
→ New Client Secret
```

Status:

```text
1 Secret Created
```

IMPORTANT:

The actual secret value is stored securely and should never be committed to Git.

Example:

```env
CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

# API Permissions Configured

Microsoft Graph Permissions Added

## Delegated Permissions

```text
openid
profile
email
offline_access
User.Read
User.Read.All
User.ReadBasic.All
User.ReadUpdate.All
User.ReadWrite
User.ReadWrite.All
AgentIdUser.ReadWrite.All
AgentIdUser.ReadWrite.IdentityParentedBy
```

## Application Permissions

```text
Calendars.ReadWrite
OnlineMeetings.ReadWrite.All
```

---

# Admin Consent

Tenant-wide Admin Consent Granted

Status:

```text
Granted for Default Directory
```

for all configured permissions.

---

# Tenant Users

Current User Found:

```text
Gautham P
```

User Principal Name:

```text
gauthamprathapsv_gmail.com#EXT#@gauthamprathapsvgmail.onmicrosoft.com
```

Identity Type:

```text
MicrosoftAccount
```

User Type:

```text
Member
```

---

# Teams Verification

Verified:

```text
https://teams.microsoft.com
```

Result:

```text
Teams opens successfully.
```

This confirms:

* Microsoft account is active
* Teams access is available
* User can access Teams services

---

# Recommended Architecture

## OAuth-Based Teams Integration

```text
React Frontend
       │
       ▼
Microsoft Login
(MSAL)
       │
       ▼
Node.js Backend
       │
       ▼
Microsoft Graph API
       │
       ▼
Create Teams Meeting
       │
       ▼
Receive joinWebUrl
       │
       ▼
Store in MongoDB
```

---

# Required Environment Variables

```env
TENANT_ID=6bea4f27-a3ee-4946-be9d-cf5889630eda

CLIENT_ID=73165d04-5236-48ba-956e-f7036e810afb

CLIENT_SECRET=abb0319b-e0c1-4307-9b5d-c23323de0e0f

REDIRECT_URI=http://localhost:3000/auth/callback
```

---

# Required NPM Packages

```bash
npm install @azure/msal-node
npm install @microsoft/microsoft-graph-client
npm install isomorphic-fetch
```

---

# Additional Permission Recommended

Add Delegated Permission:

```text
OnlineMeetings.ReadWrite
```

Path:

```text
API Permissions
→ Add Permission
→ Microsoft Graph
→ Delegated Permissions
→ OnlineMeetings.ReadWrite
```

Then:

```text
Grant Admin Consent
```

---

# Meeting Creation Endpoint

Target Graph Endpoint:

```http
POST /me/onlineMeetings
```

Example Request:

```json
{
  "startDateTime": "2026-06-10T10:00:00Z",
  "endDateTime": "2026-06-10T11:00:00Z",
  "subject": "Project Discussion"
}
```

Example Response:

```json
{
  "joinWebUrl": "https://teams.microsoft.com/l/meetup-join/..."
}
```

---

# MongoDB Storage Example

```json
{
  "_id": "meeting-id",
  "title": "Project Discussion",
  "startTime": "2026-06-10T10:00:00Z",
  "endTime": "2026-06-10T11:00:00Z",
  "teamsLink": "https://teams.microsoft.com/l/meetup-join/..."
}
```

---

# Remaining Tasks

## Azure

* [ ] Change account type to Multi-tenant + Personal Accounts
* [ ] Add OnlineMeetings.ReadWrite delegated permission

## Backend

* [ ] Configure MSAL
* [ ] Implement OAuth Login
* [ ] Store Access Token
* [ ] Store Refresh Token
* [ ] Create Graph Service
* [ ] Create Meeting API
* [ ] Save Teams URL in MongoDB

## Frontend

* [ ] Connect Microsoft Button
* [ ] OAuth Callback Page
* [ ] Meeting Scheduling Form
* [ ] Display Teams Meeting Link

---

# Final Goal

When a user clicks Schedule Meeting:

1. User selects date/time.
2. Backend creates Teams meeting.
3. Microsoft Graph returns joinWebUrl.
4. Link is saved in MongoDB.
5. Meeting details page displays Teams Join Link.
6. Participants join directly through Microsoft Teams.

```
```
