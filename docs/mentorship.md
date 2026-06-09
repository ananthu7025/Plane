# Mentorship Module (MVP)

## Overview

The Mentorship Module enables students to schedule mentorship sessions and join meetings through Microsoft Teams.

The MVP focuses only on:

* Schedule Meeting
* Join Meeting
* Admin Approval
* Microsoft Teams Integration

---

# Student Dashboard

## Statistics

Display:

* Upcoming Meetings
* Completed Meetings

---

## Upcoming Meetings

Display:

* Topic
* Date
* Time
* Status

Actions:

* Join Meeting

---

## Schedule New Meeting

Action:

* Schedule Meeting

---

# Schedule Meeting

Students can submit a mentorship request.

## Form Fields

### Topic

Examples:

* Air Navigation
* Flight Planning
* Meteorology
* Aircraft Systems
* ATPL Preparation
* CPL Preparation
* Career Guidance
* General Doubt Clearing

### Preferred Date

Date Picker

### Preferred Time

Time Slot Picker

### Description

Student enters:

* Questions
* Doubts
* Discussion Points

### Action

Submit Request

---

# Request Status

After submission, the request appears in the dashboard.

## Status Types

* Pending
* Approved
* Rejected
* Rescheduled

Display:

* Topic
* Date
* Time
* Status

---

# Admin Panel

## Meeting Requests

Display:

* Student Name
* Topic
* Preferred Date
* Preferred Time
* Description

### Actions

* Approve
* Reject
* Reschedule

---

# Microsoft Teams Integration

When a request is approved:

1. Teams Meeting is automatically created.
2. Meeting Link is generated.
3. Meeting details are saved.
4. Student receives notification.

---

# Join Meeting

Approved meetings appear in Upcoming Meetings.

Display:

* Topic
* Mentor Name
* Date
* Time

### Action

Join Teams Meeting

Clicking the button opens the Microsoft Teams meeting link.

---

# Notifications

## Student Notifications

### Meeting Requested

Sent after request submission.

### Meeting Approved

Sent after admin approval and Teams meeting creation.

### Meeting Rejected

Sent when a request is rejected.

### Meeting Rescheduled

Sent when a meeting date or time changes.

### Meeting Reminder

* 24 Hours Before
* 1 Hour Before
* 15 Minutes Before

---

# Student Flow

```text
Dashboard
    ↓
Schedule Meeting
    ↓
Submit Request
    ↓
Admin Review
    ↓
Approved
    ↓
Teams Meeting Created
    ↓
Join Meeting
    ↓
Meeting Completed
```

---

# Admin Flow

```text
Receive Request
      ↓
Review Request
      ↓
Approve / Reject / Reschedule
      ↓
Create Teams Meeting
      ↓
Student Joins Meeting
```

---

# MVP Features

## Student

* Schedule Meeting
* View Meeting Status
* View Upcoming Meetings
* Join Teams Meeting

## Admin

* View Meeting Requests
* Approve Meeting
* Reject Meeting
* Reschedule Meeting

## Microsoft Teams

* Automatic Meeting Creation
* Teams Meeting Link Generation
* One-Click Join Meeting

```
```
