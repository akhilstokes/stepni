const axios = require('axios');

// Test the all-staff endpoint
async function testStaffEndpoint() {
  try {
    // You'll need to replace this with a valid token from your browser's localStorage
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:5000/api/users/all-staff', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Success!');
    console.log('Staff count:', response.data.count);
    console.log('Staff:', response.data.staff);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testStaffEndpoint();
