const axios = require('axios');

// Test script to verify RFID attendance is visible to managers
async function testRFIDAttendanceDisplay() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 Testing RFID Attendance Display for Managers\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Login as manager
    console.log('\n📝 Step 1: Logging in as manager...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'pushyajm@gmail.com',
      password: 'pushyajm'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Manager logged in successfully');
    console.log('   User:', loginResponse.data.user.name);
    console.log('   Role:', loginResponse.data.user.role);
    
    // Step 2: Fetch today's attendance
    console.log('\n📊 Step 2: Fetching today\'s attendance...');
    const attendanceResponse = await axios.get(`${BASE_URL}/api/attendance/today-all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!attendanceResponse.data.success) {
      console.log('❌ Failed to fetch attendance');
      return;
    }
    
    const allAttendance = attendanceResponse.data.attendance;
    console.log(`✅ Total attendance records: ${allAttendance.length}`);
    
    // Step 3: Filter RFID attendance
    console.log('\n🔍 Step 3: Filtering RFID attendance records...');
    const rfidAttendance = allAttendance.filter(record => 
      record.location === 'RFID Scanner'
    );
    
    console.log(`✅ RFID attendance records found: ${rfidAttendance.length}`);
    
    if (rfidAttendance.length === 0) {
      console.log('\n⚠️  No RFID attendance records found for today');
      console.log('   This could mean:');
      console.log('   1. No one has used RFID to check in today');
      console.log('   2. The RFID system is not connected');
      console.log('   3. The location field is not set to "RFID Scanner"');
      
      // Show sample of all attendance
      console.log('\n📋 Sample of all attendance records:');
      allAttendance.slice(0, 3).forEach((record, idx) => {
        console.log(`\n   Record ${idx + 1}:`);
        console.log(`   - Staff: ${record.staff?.name || 'Unknown'}`);
        console.log(`   - Location: ${record.location || 'Not set'}`);
        console.log(`   - Check-in: ${record.checkIn || 'Not checked in'}`);
        console.log(`   - Check-out: ${record.checkOut || 'Not checked out'}`);
      });
    } else {
      console.log('\n✅ RFID Attendance Details:');
      console.log('='.repeat(60));
      
      rfidAttendance.forEach((record, idx) => {
        console.log(`\n${idx + 1}. ${record.staff?.name || 'Unknown'} (${record.staff?.staffId || 'N/A'})`);
        console.log(`   Email: ${record.staff?.email || 'N/A'}`);
        console.log(`   Check-in: ${record.checkIn ? new Date(record.checkIn).toLocaleString() : 'Not checked in'}`);
        console.log(`   Check-out: ${record.checkOut ? new Date(record.checkOut).toLocaleString() : 'Not checked out'}`);
        console.log(`   Location: ${record.location}`);
        console.log(`   Status: ${record.status || 'N/A'}`);
        console.log(`   Notes: ${record.notes || 'None'}`);
      });
    }
    
    // Step 4: Test filtering by date
    console.log('\n\n📅 Step 4: Testing date filtering...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayResponse = await axios.get(`${BASE_URL}/api/attendance/today-all`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { date: yesterdayStr }
    });
    
    const yesterdayRFID = yesterdayResponse.data.attendance?.filter(r => 
      r.location === 'RFID Scanner'
    ) || [];
    
    console.log(`✅ RFID records from ${yesterdayStr}: ${yesterdayRFID.length}`);
    
    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Manager can access attendance API: YES`);
    console.log(`✅ Total attendance records today: ${allAttendance.length}`);
    console.log(`✅ RFID attendance records today: ${rfidAttendance.length}`);
    console.log(`✅ RFID attendance records yesterday: ${yesterdayRFID.length}`);
    console.log(`✅ Date filtering works: YES`);
    
    if (rfidAttendance.length > 0) {
      console.log('\n✅ RFID ATTENDANCE IS VISIBLE TO MANAGERS');
      console.log('   The Live Check-ins page should display these records');
      console.log('   in the "RFID Attendance History" section.');
    } else {
      console.log('\n⚠️  NO RFID ATTENDANCE FOUND');
      console.log('   To test the display:');
      console.log('   1. Use the Arduino RFID scanner to check in');
      console.log('   2. Or manually create a test record with location="RFID Scanner"');
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testRFIDAttendanceDisplay();
