# RFID Attendance System

## Overview
Complete RFID-based attendance tracking system with Arduino ESP32 integration and real-time web dashboard for managers.

## System Components

### 1. Arduino ESP32 RFID Scanner
**Hardware:**
- ESP32 microcontroller
- MFRC522 RFID reader
- 16x2 LCD display (I2C)
- WiFi connectivity

**Features:**
- Automatic check-in/check-out detection
- Real-time clock synchronization (NTP)
- LCD feedback for users
- 3-second debounce protection
- Automatic WiFi reconnection

**Configuration:**
```cpp
WiFi SSID: "AKHIL"
WiFi Password: "akhilnknk"
Server URL: "http://10.196.30.39:3000/attendance"
NTP Server: "pool.ntp.org"
Timezone: IST (GMT+5:30)
```

### 2. Backend API

**Endpoint:** `POST /api/attendance/rfid`

**Request Format:**
```json
{
  "uid": "A1B2C3D4",
  "date": "08-01-2026",
  "time": "09:30:45"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "action": "check_in",
  "user": {
    "name": "John Doe",
    "staffId": "EMP001",
    "email": "john@example.com"
  },
  "attendance": {
    "date": "2026-01-08T00:00:00.000Z",
    "checkIn": "2026-01-08T09:30:45.000Z",
    "checkOut": null,
    "status": "present"
  }
}
```

**Logic:**
- First scan of the day → Check-in
- Second scan of the day → Check-out
- Third scan → Error (already completed)

### 3. Database Schema

**User Model Addition:**
```javascript
rfidUid: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
  uppercase: true
}
```

**Attendance Model:**
- staff (ObjectId ref User)
- date (Date)
- checkIn (Date)
- checkOut (Date)
- status (String: present/absent/late)
- location (String)
- notes (String)

### 4. Manager Dashboard

**Route:** `/manager/live-attendance`

**Features:**
- Real-time attendance monitoring
- Auto-refresh every 10 seconds
- Live statistics dashboard
- Search and filter capabilities
- Working hours calculation
- Status indicators

**Statistics Displayed:**
- Total Staff
- Present (checked in)
- Absent (not checked in)
- Checked Out (completed day)

**Table Columns:**
- Staff ID
- Name
- Email
- Status (badge)
- Check In Time
- Check Out Time
- Working Hours
- Location

**Filters:**
- All
- Present
- Absent

**Search:**
- By name
- By staff ID
- By email

## Setup Instructions

### 1. Register RFID Cards

Add RFID UID to user records in MongoDB:

```javascript
db.users.updateOne(
  { staffId: "EMP001" },
  { $set: { rfidUid: "A1B2C3D4" } }
)
```

Or via API/Admin panel (future enhancement).

### 2. Arduino Setup

1. Install required libraries:
   - MFRC522
   - WiFi
   - HTTPClient
   - LiquidCrystal_I2C

2. Update WiFi credentials in code
3. Update server IP address (your system IP)
4. Upload code to ESP32
5. Connect RFID reader to pins:
   - SS_PIN: 5
   - RST_PIN: 27
   - SPI: 18, 25, 23

### 3. Server Configuration

Ensure your server is accessible on the network:
- Server must be running on port 3000
- Firewall must allow incoming connections
- Use your system's local IP (e.g., 10.196.30.39)

### 4. Access Manager Dashboard

1. Login as manager
2. Navigate to "Live Attendance" from sidebar
3. View real-time attendance data
4. Data refreshes automatically every 10 seconds

## API Endpoints

### RFID Attendance (No Auth)
```
POST /api/attendance/rfid
```

### Get Today's Attendance (Manager)
```
GET /api/attendance/today-all
Authorization: Bearer <token>
```

### Get Attendance History (Manager)
```
GET /api/attendance/all?page=1&limit=20&fromDate=2026-01-01&toDate=2026-01-31
Authorization: Bearer <token>
```

## Security Considerations

1. **RFID Endpoint:** Currently no authentication (Arduino can't handle JWT)
   - Consider IP whitelisting
   - Add API key authentication
   - Rate limiting implemented server-side

2. **Manager Dashboard:** Protected by JWT authentication

3. **Database:** RFID UIDs are unique and indexed

## Troubleshooting

### Arduino Issues

**WiFi Not Connecting:**
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check signal strength

**Server Connection Failed:**
- Verify server IP address
- Check if server is running
- Test with browser: `http://10.196.30.39:3000/api/attendance/today-all`
- Check firewall settings

**RFID Not Reading:**
- Check wiring connections
- Verify RFID card is compatible (13.56MHz)
- Check SPI pins configuration

**Time Sync Failed:**
- Check internet connectivity
- Verify NTP server is accessible
- Check timezone offset

### Backend Issues

**RFID Card Not Registered:**
- Verify user has rfidUid field set
- Check UID format (uppercase, no spaces)
- Scan card and check serial monitor for UID

**Duplicate Check-in/Check-out:**
- Server prevents duplicates
- Check attendance record in database
- Clear today's record if needed

### Dashboard Issues

**No Data Showing:**
- Check if any staff checked in today
- Verify manager authentication
- Check browser console for errors
- Verify API endpoint is accessible

**Auto-refresh Not Working:**
- Check browser console for errors
- Verify token is valid
- Check network connectivity

## Future Enhancements

1. **Admin Panel for RFID Management:**
   - Register new RFID cards
   - Assign cards to users
   - Deactivate lost cards

2. **Advanced Features:**
   - Geofencing (location validation)
   - Photo capture on check-in
   - Shift validation
   - Late arrival notifications
   - Overtime calculations

3. **Reporting:**
   - Daily attendance reports
   - Monthly summaries
   - Export to Excel/PDF
   - Attendance analytics

4. **Mobile App:**
   - Manager mobile dashboard
   - Push notifications
   - QR code backup

## Files Modified/Created

### Backend:
- `server/models/userModel.js` - Added rfidUid field
- `server/controllers/attendanceController.js` - Added rfidAttendance method
- `server/routes/attendanceRoutes.js` - Added /rfid endpoint

### Frontend:
- `client/src/pages/manager/LiveAttendance.js` - New page
- `client/src/pages/manager/LiveAttendance.css` - Styles
- `client/src/App.js` - Added route
- `client/src/layouts/ManagerDashboardLayout.js` - Added menu item

### Arduino:
- ESP32 RFID attendance code (provided by user)

## Testing

1. **Test RFID Scan:**
   - Scan card on Arduino
   - Check LCD display for confirmation
   - Verify serial monitor output

2. **Test Backend:**
   ```bash
   curl -X POST http://10.196.30.39:3000/api/attendance/rfid \
     -H "Content-Type: application/json" \
     -d '{"uid":"A1B2C3D4","date":"08-01-2026","time":"09:30:45"}'
   ```

3. **Test Dashboard:**
   - Login as manager
   - Navigate to Live Attendance
   - Verify data displays correctly
   - Test search and filters
   - Verify auto-refresh

## Support

For issues or questions:
1. Check Arduino serial monitor for debug output
2. Check server logs for API errors
3. Check browser console for frontend errors
4. Verify database records in MongoDB

---

**System Status:** ✅ Fully Implemented and Ready for Testing
**Last Updated:** January 8, 2026
