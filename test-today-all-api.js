const axios = require('axios');

async function testTodayAllAPI() {
  console.log('🧪 Testing /api/attendance/today-all endpoint\n');

  // Test 1: Without authentication (should fail)
  console.log('Test 1: Without authentication');
  try {
    const response = await axios.get('http://localhost:5000/api/attendance/today-all');
    console.log('❌ FAILED: Should have required authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ PASSED: Correctly requires authentication\n');
    } else {
      console.log('❌ FAILED: Unexpected error:', error.message, '\n');
    }
  }

  // Test 2: With manager token
  console.log('Test 2: With manager authentication');
  try {
    // First login as manager
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manger@xyz.com',
      password: 'manager123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained\n');

    // Now test the today-all endpoint
    console.log('Test 3: Fetching today\'s attendance');
    const attendanceResponse = await axios.get('http://localhost:5000/api/attendance/today-all', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ API Response received');
    console.log('Success:', attendanceResponse.data.success);
    console.log('Attendance records:', attendanceResponse.data.attendance?.length || 0);
    
    if (attendanceResponse.data.attendance && attendanceResponse.data.attendance.length > 0) {
      console.log('\nSample record:');
      const sample = attendanceResponse.data.attendance[0];
      console.log('- Staff:', sample.staff?.name || 'N/A');
      console.log('- Check In:', sample.checkIn || 'N/A');
      console.log('- Check Out:', sample.checkOut || 'N/A');
      console.log('- Status:', sample.status || 'N/A');
    } else {
      console.log('\n⚠️  No attendance records found for today');
    }

    console.log('\n✅ ALL TESTS PASSED');
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTodayAllAPI();
