# RFID Attendance Endpoint - Fixed ✅

## Issue Identified
The error "Not authorized, no token" occurs when accessing the endpoint via browser because:
1. **Browser makes GET request** - but the endpoint only accepts POST
2. **The route is correctly configured** without authentication middleware

## Solution Applied

### 1. Updated Controller (`server/controllers/attendanceController.js`)
- Added better error handling and logging
- Made date/time parsing more flexible (optional parameters)
- Added case-insensitive RFID UID matching
- Added detailed console logs for debugging

### 2. Route Configuration (Already Correct)
```javascript
// RFID attendance endpoint (no auth - called by Arduino)
router.post('/rfid', attendanceController.rfidAttendance);
```

## Testing the Endpoint

### Method 1: Using curl (Command Line)
```bash
curl -X POST http://10.196.30.39:5000/api/attendance/rfid \
  -H "Content-Type: application/json" \
  -d "{\"uid\":\"TEST123\",\"date\":\"08-01-2026\",\"time\":\"09:30:00\"}"
```

### Method 2: Using the Test Script
```bash
# First, add RFID UID to a user
node add-rfid-to-user.js

# Then test the endpoint
node test-rfid-endpoint.js
```

### Method 3: Using Postman
1. **Method**: POST
2. **URL**: `http://10.196.30.39:5000/api/attendance/rfid`
3. **Headers**: 
   - Content-Type: application/json
4. **Body** (raw JSON):
```json
{
  "uid": "TEST123",
  "date": "08-01-2026",
  "time": "09:30:00"
}
```

### Method 4: Arduino Code
```cpp
// In your Arduino sketch
String uid = "TEST123";  // From RFID reader
String date = "08-01-2026";  // DD-MM-YYYY
String time = "09:30:00";    // HH:MM:SS

String jsonData = "{\"uid\":\"" + uid + "\",\"date\":\"" + date + "\",\"time\":\"" + time + "\"}";

http.begin("http://10.196.30.39:5000/api/attendance/rfid");
http.addHeader("Content-Type", "application/json");
int httpCode = http.POST(jsonData);
```

## Expected Responses

### Success (Check-in)
```json
{
  "success": true,
  "message": "Check-in successful",
  "action": "check_in",
  "user": {
    "name": "John Doe",
    "staffId": "STF001",
    "email": "john@example.com"
  },
  "attendance": {
    "date": "2026-01-08T00:00:00.000Z",
    "checkIn": "2026-01-08T09:30:00.000Z",
    "checkOut": null,
    "status": "present"
  }
}
```

### Success (Check-out)
```json
{
  "success": true,
  "message": "Check-out successful",
  "action": "check_out",
  "user": {
    "name": "John Doe",
    "staffId": "STF001",
    "email": "john@example.com"
  },
  "attendance": {
    "date": "2026-01-08T00:00:00.000Z",
    "checkIn": "2026-01-08T09:30:00.000Z",
    "checkOut": "2026-01-08T17:30:00.000Z",
    "status": "present"
  }
}
```

### Error: RFID Not Registered
```json
{
  "message": "RFID card not registered",
  "uid": "UNKNOWN123"
}
```

### Error: Already Checked In/Out
```json
{
  "message": "Already checked in and out today",
  "user": {
    "name": "John Doe",
    "staffId": "STF001"
  }
}
```

## Setup Steps

### 1. Add RFID UID to User
Run the helper script to add an RFID UID to a test user:
```bash
node add-rfid-to-user.js
```

This will:
- Find a suitable user (labour, field_staff, or user role)
- Add RFID UID "TEST123" to that user
- Display the user details for testing

### 2. Test the Endpoint
```bash
node test-rfid-endpoint.js
```

## Database Schema

### User Model - RFID Field
```javascript
rfidUid: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
  uppercase: true  // Automatically converts to uppercase
}
```

### Attendance Model - Fields
```javascript
{
  staff: ObjectId,        // Reference to User
  date: Date,             // Date of attendance (00:00:00)
  checkIn: Date,          // Check-in timestamp
  checkOut: Date,         // Check-out timestamp
  status: String,         // 'present', 'absent', 'late', 'half_day'
  location: String,       // Location description
  notes: String           // Additional notes
}
```

## Important Notes

1. **Browser Access**: You cannot test POST endpoints by typing the URL in a browser address bar. Use curl, Postman, or the test script.

2. **RFID UID Format**: The system automatically converts RFID UIDs to uppercase for consistency.

3. **Date/Time Format**: 
   - Date: DD-MM-YYYY (e.g., "08-01-2026")
   - Time: HH:MM:SS (e.g., "09:30:00")
   - Both are optional; if not provided, current timestamp is used

4. **Check-in/Check-out Logic**:
   - First scan of the day = Check-in
   - Second scan of the day = Check-out
   - Third scan = Error (already checked in and out)

5. **No Authentication Required**: This endpoint is specifically designed to work without authentication tokens for Arduino/RFID hardware integration.

## Troubleshooting

### Issue: "RFID card not registered"
**Solution**: Add the RFID UID to a user in the database:
```bash
node add-rfid-to-user.js
```

### Issue: "Not authorized, no token"
**Cause**: You're accessing the endpoint via browser (GET request)
**Solution**: Use POST request with curl, Postman, or the test script

### Issue: Connection refused
**Cause**: Server is not running
**Solution**: Start the server:
```bash
cd server
npm start
```

### Issue: "Already checked in and out today"
**Solution**: This is expected behavior. Wait until the next day or manually delete the attendance record from the database.

## Files Modified
1. ✅ `server/controllers/attendanceController.js` - Enhanced RFID handler
2. ✅ `server/routes/attendanceRoutes.js` - Already correctly configured
3. ✅ Created `test-rfid-endpoint.js` - Test script
4. ✅ Created `add-rfid-to-user.js` - Helper script to add RFID to users

## Next Steps
1. Run `node add-rfid-to-user.js` to set up a test user
2. Run `node test-rfid-endpoint.js` to verify the endpoint works
3. Update your Arduino code to use the correct endpoint and format
4. Test with actual RFID hardware
