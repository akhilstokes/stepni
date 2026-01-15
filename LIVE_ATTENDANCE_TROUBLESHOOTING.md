# Live Attendance Page Troubleshooting Guide

## Issue: Attendance history not showing

### ✅ What We've Verified

1. **Database has records**: 2 attendance records exist for today
   - akhil N. K (Lab staff) - Checked in at 9:38 AM
   - Morni Bagama (Field staff) - Checked in at 9:27 AM

2. **API endpoint is working**: `/api/attendance/today-all` returns data correctly

3. **Backend code is fixed**: Updated to support optional date parameter

### 🔍 Debugging Steps

#### Step 1: Check if Frontend Code is Updated
The frontend now has detailed console logging. You need to **refresh the browser** to load the updated code.

1. Open the Live Attendance page: `http://localhost:3000/manager/live`
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) to hard refresh
3. Open Browser DevTools: Press `F12`
4. Go to the **Console** tab

#### Step 2: Check Console Logs
You should see these log messages:
```
🔍 Fetching attendance for date: 2026-01-09
🔑 Token exists: true
📥 API Response: {success: true, attendance: Array(2)}
✅ Attendance records: 2
```

#### Step 3: Common Issues and Solutions

##### Issue A: "Token exists: false"
**Problem**: User is not logged in or token expired

**Solution**:
1. Log out and log back in
2. Check localStorage: Open Console and run:
   ```javascript
   localStorage.getItem('token')
   ```
3. If null, you need to log in again

##### Issue B: "401 Unauthorized" or "403 Forbidden"
**Problem**: User doesn't have manager/admin/accountant role

**Solution**:
1. Check your user role in Console:
   ```javascript
   JSON.parse(localStorage.getItem('user'))
   ```
2. Your role must be one of: `manager`, `admin`, or `accountant`
3. If not, you need to log in with a manager account

##### Issue C: "Network Error" or "ERR_CONNECTION_REFUSED"
**Problem**: Backend server is not running

**Solution**:
1. Start the server:
   ```bash
   cd server
   node server.js
   ```
2. Verify server is running on port 5000
3. Check server console for any errors

##### Issue D: "Attendance records: 0"
**Problem**: API returns empty array

**Solution**:
1. Check the date picker - make sure it's set to today's date
2. Verify attendance records exist for that date:
   ```bash
   cd server
   node test-attendance-data.js
   ```

##### Issue E: CORS or Proxy Issues
**Problem**: Frontend can't reach backend

**Solution**:
1. Verify proxy is configured in `client/package.json`:
   ```json
   "proxy": "http://localhost:5000"
   ```
2. Restart the React development server:
   ```bash
   cd client
   npm start
   ```

### 🧪 Manual API Test

You can test the API directly from the browser console:

1. Open Browser DevTools (F12)
2. Go to Console tab
3. Run this code:

```javascript
const token = localStorage.getItem('token');
fetch('/api/attendance/today-all', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

Expected response:
```json
{
  "success": true,
  "attendance": [
    {
      "_id": "...",
      "staff": {
        "name": "akhil N. K",
        "email": "akhilnk239@gmail.com",
        "role": "lab",
        "staffId": null
      },
      "checkIn": "2026-01-09T04:08:30.000Z",
      "checkOut": "2026-01-09T04:08:34.000Z",
      "status": "present",
      ...
    }
  ]
}
```

### 📋 Quick Checklist

- [ ] Server is running (`node server.js` in server directory)
- [ ] React app is running (`npm start` in client directory)
- [ ] User is logged in (check localStorage.getItem('token'))
- [ ] User has correct role (manager/admin/accountant)
- [ ] Browser page is hard refreshed (Ctrl + Shift + R)
- [ ] Browser console shows no errors
- [ ] Date picker is set to correct date
- [ ] Attendance records exist in database

### 🔧 Files Modified

1. **server/controllers/attendanceController.js**
   - Updated `getTodayAttendanceAll` to support date parameter
   - Now properly queries attendance records by date

2. **client/src/pages/manager/LiveAttendance.js**
   - Added detailed console logging for debugging
   - Better error handling and display

### 📞 Next Steps

If the issue persists after following these steps:

1. Share the console logs from the browser
2. Share the server console output
3. Verify your user role and authentication status
4. Check if there are any network errors in the Network tab of DevTools

### 🎯 Expected Behavior

When working correctly, you should see:
- 2 attendance records displayed in the table
- Stats showing: Total: 2, Present: 0, Completed: 2
- Both users (akhil N. K and Morni Bagama) listed with their check-in/out times
- Auto-refresh every 30 seconds
