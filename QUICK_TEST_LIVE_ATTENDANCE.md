# Quick Test Guide - Live Attendance RFID System

## 🚀 Quick Start

### 1. Start the Server
```bash
cd server
npm start
```
Server should be running on `http://localhost:5000`

### 2. Access Live Attendance Page
```
http://localhost:3000/manager/live
```

Login with manager credentials to access the page.

## 📋 What You Should See

### Statistics Cards (Top Row)
- **Total Staff** - Count of all staff members
- **Present** - Currently checked in (not checked out)
- **Late** - Staff who arrived late
- **Completed** - Staff who checked in and out
- **Absent** - Staff with no check-in record

### Attendance Table
Each row shows:
- Staff avatar with initials
- Name and email
- Staff ID
- Role (staff, delivery, lab, etc.)
- Shift information (if assigned)
- Check-in time
- Check-out time
- Working duration
- Status badge (color-coded)
- Location

### Features to Test
1. **Date Picker** - Select different dates to view historical data
2. **Search Box** - Search by name, staff ID, or email
3. **Filter Buttons** - Filter by All, Present, Late, Completed, Absent
4. **Refresh Button** - Manual refresh (auto-refreshes every 30s)
5. **Auto-refresh Indicator** - Green pulsing dot showing live updates

## 🧪 Test RFID Attendance

### Step 1: Add RFID to a User
```bash
node quick-add-rfid.js user@example.com 54081705
```

Replace `user@example.com` with actual user email and `54081705` with RFID UID.

### Step 2: Simulate RFID Check-in
```bash
node test-rfid-endpoint.js
```

This will simulate an RFID scan and mark attendance.

### Step 3: Verify on Live Page
1. Go to `http://localhost:3000/manager/live`
2. You should see the user's status change to "Present"
3. Check-in time should be displayed
4. Status badge should be green with "On Time" or yellow with "Late"

### Step 4: Simulate Check-out
Run the test script again:
```bash
node test-rfid-endpoint.js
```

The same user scanning again will check out.

### Step 5: Verify Check-out
1. Refresh the live attendance page
2. User status should change to "Completed"
3. Check-out time should be displayed
4. Working duration should show total hours worked

## 🔍 Verification Checklist

### ✅ All Staff Visibility
- [ ] Total staff count matches database
- [ ] Absent staff are shown with red badges
- [ ] Present staff are shown with green badges
- [ ] Late staff are shown with yellow badges
- [ ] Completed staff are shown with purple badges

### ✅ RFID Integration
- [ ] First scan creates check-in record
- [ ] Second scan creates check-out record
- [ ] Third scan shows "already checked out" error
- [ ] Unknown RFID shows "not registered" error

### ✅ Filtering & Search
- [ ] "All" filter shows all staff
- [ ] "Present" filter shows only checked-in staff
- [ ] "Late" filter shows only late arrivals
- [ ] "Completed" filter shows only checked-out staff
- [ ] "Absent" filter shows only absent staff
- [ ] Search works for name, staff ID, and email

### ✅ Date Selection
- [ ] Today's date is selected by default
- [ ] Can select past dates
- [ ] Can select future dates (should show all absent)
- [ ] Data updates when date changes

### ✅ Real-time Updates
- [ ] Page auto-refreshes every 30 seconds
- [ ] Green pulsing dot indicates live updates
- [ ] Manual refresh button works
- [ ] Loading spinner shows during refresh

### ✅ UI/UX
- [ ] Stat cards show correct counts
- [ ] Staff avatars display initials
- [ ] Status badges are color-coded
- [ ] Time format is readable (12-hour with AM/PM)
- [ ] Duration shows hours and minutes
- [ ] Table is responsive on mobile
- [ ] Hover effects work on table rows

## 🐛 Common Issues & Solutions

### Issue: "No attendance records found"
**Possible Causes:**
- No staff in database
- All staff are admins (admins are excluded)
- Date filter is set to future date

**Solution:**
- Check database has staff users
- Verify staff have roles other than 'admin'
- Reset date to today

### Issue: RFID scan not working
**Possible Causes:**
- User doesn't have rfidUid field
- UID doesn't match database
- Server not running

**Solution:**
```bash
# Add RFID to user
node quick-add-rfid.js user@example.com ACTUAL_UID

# Test endpoint
node test-rfid-endpoint.js

# Check server logs
```

### Issue: Absent staff not showing
**Possible Causes:**
- Old code still running
- Browser cache

**Solution:**
- Restart server
- Clear browser cache (Ctrl+Shift+R)
- Check server logs for errors

### Issue: Stats not updating
**Possible Causes:**
- Auto-refresh disabled
- Network error
- Authentication expired

**Solution:**
- Click manual refresh button
- Check browser console for errors
- Re-login if session expired

## 📊 Expected Behavior

### Scenario 1: Fresh Day (No Attendance)
- All staff show as "Absent"
- Present count = 0
- Absent count = Total staff
- All status badges are red

### Scenario 2: Staff Checking In
- Staff scans RFID card
- Status changes from "Absent" to "Present"
- Check-in time is recorded
- Present count increases
- Absent count decreases

### Scenario 3: Late Arrival
- Staff checks in after shift start time + grace period
- Status shows "Late (Xm)" where X is minutes late
- Late count increases
- Status badge is yellow

### Scenario 4: Staff Checking Out
- Staff scans RFID card again
- Status changes to "Completed"
- Check-out time is recorded
- Working duration is calculated
- Present count decreases
- Completed count increases

### Scenario 5: Viewing Past Date
- Select past date from date picker
- Shows historical attendance data
- Stats reflect that day's attendance
- Can compare different dates

## 🎯 Success Criteria

The system is working correctly if:

1. ✅ All staff members are visible (present and absent)
2. ✅ RFID check-in creates attendance record
3. ✅ RFID check-out updates attendance record
4. ✅ Statistics are accurate and update in real-time
5. ✅ Filtering and search work correctly
6. ✅ Date selection shows correct historical data
7. ✅ UI is responsive and visually appealing
8. ✅ Auto-refresh works every 30 seconds
9. ✅ Status badges are color-coded correctly
10. ✅ Working duration is calculated accurately

## 📞 Need Help?

If you encounter issues:

1. Check server logs for errors
2. Check browser console for errors
3. Verify database connection
4. Ensure all dependencies are installed
5. Restart server and clear browser cache

## 🎉 You're All Set!

The Live Attendance RFID system is now fully functional and ready to use. Enjoy real-time attendance tracking with complete staff visibility!
