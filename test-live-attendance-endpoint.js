const axios = require('axios');

async function testLiveAttendanceEndpoint() {
  try {
    console.log('🧪 Testing Live Attendance API Endpoint\n');
    
    // Test without authentication (should fail)
    console.log('1️⃣ Testing without authentication...');
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/today-all');
      console.log('❌ Unexpected: Request succeeded without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected: 401 Unauthorized');
      } else {
        console.log('⚠️  Error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }

    // Instructions for manual testing
    console.log('\n2️⃣ To test with authentication:');
    console.log('   a. Open browser DevTools (F12)');
    console.log('   b. Go to Console tab');
    console.log('   c. Run: localStorage.getItem("token")');
    console.log('   d. Copy the token value');
    console.log('   e. Replace YOUR_TOKEN_HERE below and run this script again\n');

    // If you have a token, uncomment and add it here:
    // const token = 'YOUR_TOKEN_HERE';
    // console.log('Testing with authentication...');
    // const response = await axios.get('http://localhost:5000/api/attendance/today-all', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // console.log('✅ Success!');
    // console.log('Records found:', response.data.attendance?.length || 0);
    // console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLiveAttendanceEndpoint();
