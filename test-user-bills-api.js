const axios = require('axios');

async function testUserBillsAPI() {
  try {
    console.log('🧪 Testing User Bills API\n');
    
    // Step 1: Login as akhil N.K
    console.log('1️⃣ Logging in as akhil N.K...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'akhilnk856@gmail.com',
      password: 'Test@123'  // You may need to update this
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.user.role}\n`);
    
    // Step 2: Fetch user bills
    console.log('2️⃣ Fetching user bills...');
    const billsResponse = await axios.get('http://localhost:5000/api/bills/user/my-bills', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Bills API response:');
    console.log(`   Success: ${billsResponse.data.success}`);
    console.log(`   Total bills: ${billsResponse.data.total}`);
    console.log(`   Bills returned: ${billsResponse.data.bills.length}\n`);
    
    if (billsResponse.data.bills.length > 0) {
      console.log('📋 Bills:');
      billsResponse.data.bills.forEach((bill, index) => {
        console.log(`\n${index + 1}. ${bill.billNumber}`);
        console.log(`   Customer: ${bill.customerName}`);
        console.log(`   Phone: ${bill.customerPhone}`);
        console.log(`   Status: ${bill.status}`);
        console.log(`   Amount: ₹${bill.totalAmount}`);
        console.log(`   Barrels: ${bill.barrelCount}`);
        console.log(`   DRC: ${bill.drcPercent}%`);
      });
    } else {
      console.log('❌ No bills returned!');
      console.log('\nResponse data:', JSON.stringify(billsResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Login failed. Please check the password.');
      console.log('   Try updating the password in this script or reset it in the database.');
    }
  }
}

testUserBillsAPI();
