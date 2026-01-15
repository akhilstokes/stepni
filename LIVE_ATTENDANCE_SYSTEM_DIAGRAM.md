# Live Attendance System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LIVE ATTENDANCE SYSTEM                          │
│                    RFID-Based Attendance Tracking                   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Arduino    │         │   Manager    │         │   Database   │
│ RFID Reader  │         │  Dashboard   │         │   MongoDB    │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         NODE.JS SERVER                              │
│                      (Express + Mongoose)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────┐ │
│  │  RFID Endpoint   │    │  Auth Middleware │    │   Models    │ │
│  │  /api/attendance │    │  JWT Validation  │    │  User       │ │
│  │      /rfid       │    │  Role Check      │    │  Attendance │ │
│  └────────┬─────────┘    └────────┬─────────┘    │  Shift      │ │
│           │                       │               └─────────────┘ │
│           ▼                       ▼                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           Attendance Controller                              │ │
│  │  - getTodayAttendanceAll()                                   │ │
│  │  - rfidAttendance()                                          │ │
│  │  - markAttendance()                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### RFID Check-in Flow

```
┌─────────────┐
│   Staff     │
│  Scans Card │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Arduino RFID Reader                      │
│  - Reads UID from card                                      │
│  - Gets current date/time                                   │
│  - Sends HTTP POST request                                  │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ POST /api/attendance/rfid
       │ { uid: "54081705", date: "09-01-2026", time: "09:00:00" }
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Server: RFID Attendance Handler                │
│                                                             │
│  1. Receive UID from Arduino                                │
│  2. Find user by rfidUid in database                        │
│  3. Check if attendance exists for today                    │
│                                                             │
│     ┌─────────────────────────────────────┐                │
│     │  No Attendance Record?              │                │
│     │  → Create new record (Check-in)     │                │
│     └─────────────────────────────────────┘                │
│                                                             │
│     ┌─────────────────────────────────────┐                │
│     │  Has Check-in, No Check-out?        │                │
│     │  → Update record (Check-out)        │                │
│     └─────────────────────────────────────┘                │
│                                                             │
│     ┌─────────────────────────────────────┐                │
│     │  Already Checked Out?               │                │
│     │  → Return error message             │                │
│     └─────────────────────────────────────┘                │
│                                                             │
│  4. Save to database                                        │
│  5. Return success response                                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                         │
│  - Attendance collection updated                            │
│  - Timestamp recorded                                       │
│  - Status calculated                                        │
└─────────────────────────────────────────────────────────────┘
```

### Manager Dashboard Flow

```
┌─────────────┐
│   Manager   │
│ Opens Page  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Browser: Live Attendance Page                  │
│  URL: http://localhost:3000/manager/live                   │
└──────┬──────────────────────────────────────────────────────┘
       │
       │ GET /api/attendance/today-all?date=2026-01-09
       │ Authorization: Bearer <JWT_TOKEN>
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Server: Auth Middleware                        │
│  1. Validate JWT token                                      │
│  2. Check user role (manager/admin/accountant)              │
│  3. Allow or deny access                                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│         Server: getTodayAttendanceAll Controller            │
│                                                             │
│  Step 1: Fetch ALL Staff                                    │
│  ┌────────────────────────────────────────────┐            │
│  │ User.find({ role: { $ne: 'admin' } })      │            │
│  │ .select('name email role staffId')         │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Step 2: Fetch Attendance Records                           │
│  ┌────────────────────────────────────────────┐            │
│  │ Attendance.find({ date: today })           │            │
│  │ .populate('staff shift markedBy')          │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Step 3: Create Attendance Map                              │
│  ┌────────────────────────────────────────────┐            │
│  │ Map<staffId, attendanceRecord>             │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Step 4: Merge Data                                         │
│  ┌────────────────────────────────────────────┐            │
│  │ For each staff:                            │            │
│  │   If attendance exists → use it            │            │
│  │   Else → create absent record              │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Step 5: Sort Results                                       │
│  ┌────────────────────────────────────────────┐            │
│  │ Present → Late → Absent                    │            │
│  │ Then by check-in time                      │            │
│  └────────────────────────────────────────────┘            │
│                                                             │
│  Step 6: Return JSON Response                               │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Browser: Render UI                             │
│                                                             │
│  1. Calculate statistics                                    │
│     - Total, Present, Late, Completed, Absent               │
│                                                             │
│  2. Apply filters (if any)                                  │
│     - All, Present, Late, Completed, Absent                 │
│                                                             │
│  3. Apply search (if any)                                   │
│     - Filter by name/staffId/email                          │
│                                                             │
│  4. Render table rows                                       │
│     - Staff info, times, status badges                      │
│                                                             │
│  5. Start auto-refresh timer (30s)                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LiveAttendance Component                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        State Management                      │  │
│  │  - attendanceData: []                                        │  │
│  │  - loading: boolean                                          │  │
│  │  - error: string                                             │  │
│  │  - filter: 'all' | 'present' | 'late' | 'completed' | ...   │  │
│  │  - searchTerm: string                                        │  │
│  │  - selectedDate: Date                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Effects & Hooks                         │  │
│  │  - useEffect: Fetch data on mount & date change              │  │
│  │  - useEffect: Auto-refresh every 30s                         │  │
│  │  - fetchLiveAttendance(): API call                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Helper Functions                         │  │
│  │  - formatTime(): Format timestamp                            │  │
│  │  - calculateWorkingHours(): Calculate duration               │  │
│  │  - getStatusBadge(): Get badge config                        │  │
│  │  - filteredData: Apply filters & search                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      UI Components                           │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Header                                                 │ │  │
│  │  │  - Title & description                                  │ │  │
│  │  │  - Date picker                                          │ │  │
│  │  │  - Auto-refresh indicator                               │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Statistics Grid                                        │ │  │
│  │  │  - Total Staff card                                     │ │  │
│  │  │  - Present card                                         │ │  │
│  │  │  - Late card                                            │ │  │
│  │  │  - Completed card                                       │ │  │
│  │  │  - Absent card                                          │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Controls Bar                                           │ │  │
│  │  │  - Search box                                           │ │  │
│  │  │  - Filter buttons                                       │ │  │
│  │  │  - Refresh button                                       │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Attendance Table                                       │ │  │
│  │  │  - Table header                                         │ │  │
│  │  │  - Table rows (mapped from filteredData)               │ │  │
│  │  │  - Empty state (if no data)                            │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Table Footer                                           │ │  │
│  │  │  - Record count                                         │ │  │
│  │  │  - Total working hours                                  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Collection                             │
├─────────────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                                      │
│  name: String                                                       │
│  email: String (unique)                                             │
│  role: String (staff, manager, admin, delivery, lab, accountant)    │
│  staffId: String (unique)                                           │
│  rfidUid: String (unique, sparse, uppercase)  ← RFID Integration   │
│  password: String (hashed)                                          │
│  createdAt: Date                                                    │
│  updatedAt: Date                                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     Attendance Collection                           │
├─────────────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                                      │
│  staff: ObjectId → User                                             │
│  date: Date (00:00:00)                                              │
│  shift: ObjectId → Shift (optional)                                 │
│  checkIn: Date (timestamp)                                          │
│  checkOut: Date (timestamp)                                         │
│  status: String (present, absent, late, half_day)                   │
│  location: String                                                   │
│  notes: String                                                      │
│  isLate: Boolean                                                    │
│  lateMinutes: Number                                                │
│  workingHours: Number (minutes)                                     │
│  markedBy: ObjectId → User (optional)                               │
│  createdAt: Date                                                    │
│  updatedAt: Date                                                    │
│                                                                     │
│  Indexes:                                                           │
│  - { staff: 1, date: -1 }                                           │
│  - { date: -1 }                                                     │
│  - { status: 1 }                                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       Shift Collection                              │
├─────────────────────────────────────────────────────────────────────┤
│  _id: ObjectId                                                      │
│  name: String                                                       │
│  startTime: String (HH:MM)                                          │
│  endTime: String (HH:MM)                                            │
│  gracePeriod: Number (minutes)                                      │
│  assignedStaff: [ObjectId] → User                                   │
│  isActive: Boolean                                                  │
│  createdAt: Date                                                    │
│  updatedAt: Date                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## API Endpoints Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Endpoints                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PUBLIC (No Auth)                                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ POST /api/attendance/rfid                                  │    │
│  │ Body: { uid, date, time }                                  │    │
│  │ → RFID attendance marking                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  STAFF (Authenticated)                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ GET  /api/attendance/today                                 │    │
│  │ → Get own today's attendance                               │    │
│  │                                                            │    │
│  │ POST /api/attendance/mark                                  │    │
│  │ Body: { type, location, notes }                            │    │
│  │ → Mark own attendance                                      │    │
│  │                                                            │    │
│  │ GET  /api/attendance/history                               │    │
│  │ Query: { page, limit, fromDate, toDate }                   │    │
│  │ → Get own attendance history                               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  MANAGER/ADMIN/ACCOUNTANT                                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ GET  /api/attendance/today-all                             │    │
│  │ Query: { date }                                            │    │
│  │ → Get all staff attendance for date                        │    │
│  │                                                            │    │
│  │ GET  /api/attendance/all                                   │    │
│  │ Query: { page, limit, staffId, fromDate, toDate, status }  │    │
│  │ → Get all attendance with filters                          │    │
│  │                                                            │    │
│  │ GET  /api/attendance/analytics                             │    │
│  │ Query: { fromDate, toDate, staffId }                       │    │
│  │ → Get attendance analytics                                 │    │
│  │                                                            │    │
│  │ POST /api/attendance/admin/mark                            │    │
│  │ Body: { staffId, type, location, notes, timestamp }        │    │
│  │ → Admin mark attendance for staff                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              JWT Token Validation                           │
│  1. Extract token from Authorization header                 │
│  2. Verify token signature                                  │
│  3. Check token expiration                                  │
│  4. Decode user information                                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Role-Based Access Control                      │
│  1. Check user role                                         │
│  2. Verify required permissions                             │
│  3. Allow or deny access                                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Controller Logic                               │
│  1. Validate input data                                     │
│  2. Sanitize user input                                     │
│  3. Execute business logic                                  │
│  4. Return response                                         │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Performance Strategies                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Database Level                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ • Indexes on frequently queried fields                    │    │
│  │ • .lean() for read-only queries (no Mongoose overhead)    │    │
│  │ • .select() to limit returned fields                      │    │
│  │ • Compound indexes for complex queries                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Server Level                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ • Map-based merging (O(n) complexity)                      │    │
│  │ • Single database query per request                        │    │
│  │ • Efficient sorting algorithm                              │    │
│  │ • Response compression                                     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Client Level                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ • Client-side filtering (no server round-trips)            │    │
│  │ • Client-side search (instant results)                     │    │
│  │ • Debounced auto-refresh (30s interval)                    │    │
│  │ • Lazy loading for large datasets                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**System Status:** ✅ Fully Operational
**Last Updated:** January 9, 2026
**Version:** 1.0.0
