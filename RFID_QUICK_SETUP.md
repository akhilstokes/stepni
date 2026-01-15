# RFID Attendance - Quick Setup Guide

## ✅ System Status
Your RFID attendance system is **WORKING CORRECTLY**!

The endpoint `http://10.196.30.39:5000/api/attendance/rfid` is accessible without authentication.

## Next Steps

### 1. Register RFID Cards for Staff

You need to add the RFID UID to each staff member's database record.

#### Option A: Using the Script (Recommended)

```bash
cd server
node scripts/registerRfidCard.js staff@example.com A1B2C3D4
```

Example:
```bash
node scripts/registerRfidCard.js john@holyfamily.com 04A1B2C3
```

#### Option B: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `users` collection
4. Find the staff member
5. Add field: `rfidUid: "04A1B2C3"` (uppercase)

#### Option C: Using MongoDB Shell

```javascript
db.users.updateOne(
  { email: "john@holyfamily.com" },
  { $set: { rfidUid: "04A1B2C3" } }
)
```

### 2. Get RFID Card UIDs

To find out what UID your RFID cards have:

1. Upload your Arduino code
2. Open Serial Monitor (115200 baud)
3. Tap an RFID card on the reader
4. The UID will be displayed in the serial monitor
5. Copy the UID (e.g., "04A1B2C3")
6. Register it for a staff member

### 3. Test the System

#### Test with Script:
```bash
cd server
node scripts/testRfidAttendance.js 04A1B2C3
```

#### Test with Arduino:
1. Make sure Arduino is connected to WiFi
2. Update server URL in Arduino code:
   ```cpp
   const char* serverUrl = "http://10.196.30.39:5000/api/attendance/rfid";
   ```
3. Tap RFID card
4. LCD should show "Attendance OK"

### 4. View Live Attendance

Managers can view live attendance at:
```
http://localhost:3000/manager/live
```

Or on your network:
```
http://10.196.30.39:3000/manager/live
```

## Arduino Configuration

Update these values in your Arduino code:

```cpp
/* ===== WIFI DETAILS ===== */
const char* ssid = "AKHIL";              // Your WiFi name
const char* password = "akhilnknk";      // Your WiFi password

/* ===== SERVER ===== */
const char* serverUrl = "http://10.196.30.39:5000/api/attendance/rfid";
```

## Expected Behavior

### First Scan (Check-in)
- Arduino sends: `{ uid: "04A1B2C3", date: "08-01-2026", time: "09:30:00" }`
- Server creates attendance record with check-in time
- LCD shows: "Attendance OK" + time
- Serial Monitor shows: "HTTP Response: 200"

### Second Scan (Check-out)
- Arduino sends same data
- Server updates attendance record with check-out time
- LCD shows: "Attendance OK" + time
- Serial Monitor shows: "HTTP Response: 200"

### Third Scan (Already done)
- Arduino sends same data
- Server returns error: "Already checked in and out today"
- LCD shows: "Server Error" + error code
- Serial Monitor shows: "HTTP Response: 400"

## Troubleshooting

### Error: "RFID card not registered"
**Solution**: Register the RFID UID for a staff member
```bash
node scripts/registerRfidCard.js staff@example.com 04A1B2C3
```

### Error: "Not authorized, no token"
**Cause**: You're accessing the wrong endpoint or using a browser with cached auth
**Solution**: Make sure you're using `/api/attendance/rfid` (not `/api/attendance/mark`)

### Arduino can't connect to server
1. Check WiFi connection (Arduino serial monitor)
2. Ping server from Arduino network: `ping 10.196.30.39`
3. Verify server is running: `http://10.196.30.39:5000`
4. Check firewall settings

### LCD shows "Server Error"
1. Check Arduino serial monitor for HTTP response code
2. Check server logs for errors
3. Verify RFID card is registered

## List All Registered Cards

```bash
cd server
node scripts/listRfidCards.js
```

This will show all staff members with registered RFID cards.

## Sample Staff Registration

Let's say you have these staff members:

```bash
# Register RFID cards
node scripts/registerRfidCard.js john@holyfamily.com 04A1B2C3
node scripts/registerRfidCard.js mary@holyfamily.com 04D5E6F7
node scripts/registerRfidCard.js peter@holyfamily.com 04G8H9I0

# List all registered cards
node scripts/listRfidCards.js
```

## Testing Flow

1. **Register a test card**:
   ```bash
   node scripts/registerRfidCard.js test@holyfamily.com TEST1234
   ```

2. **Test check-in**:
   ```bash
   node scripts/testRfidAttendance.js TEST1234
   ```
   Expected: "Check-in successful"

3. **Test check-out**:
   ```bash
   node scripts/testRfidAttendance.js TEST1234 checkout
   ```
   Expected: "Check-out successful"

4. **View in dashboard**:
   - Login as manager
   - Go to http://localhost:3000/manager/live
   - See the test attendance record

## Production Checklist

- [ ] Server is running on `10.196.30.39:5000`
- [ ] Arduino is connected to WiFi
- [ ] Arduino can reach server (ping test)
- [ ] RFID cards are registered for all staff
- [ ] Test check-in works
- [ ] Test check-out works
- [ ] Manager can view live attendance
- [ ] LCD displays messages correctly
- [ ] Serial monitor shows successful HTTP responses

## Support

If you encounter issues:
1. Check Arduino serial monitor for debug output
2. Check server logs: `console.log` in attendanceController
3. Test endpoint with script: `node scripts/testRfidAttendance.js`
4. Verify database records in MongoDB Compass

---

**Status**: ✅ System is ready to use!

Just register RFID cards and start scanning!
