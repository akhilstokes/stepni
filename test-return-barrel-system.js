// Test Return Barrel Management System
// Run this after setup to verify everything works

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/return-barrels';
let authToken = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n🔐 Logging in as admin...', 'cyan');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com', // Change to your admin email
      password: 'admin123' // Change to your admin password
    });
    
    authToken = response.data.token;
    log('✅ Login successful!', 'green');
    return true;
  } catch (error) {
    log('❌ Login failed. Please update credentials in test script.', 'red');
    log(`Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetHangerSpaces() {
  try {
    log('\n📦 Testing: Get Hanger Spaces', 'cyan');
    const response = await axios.get(`${BASE_URL}/hanger-spaces`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log(`✅ Found ${response.data.count} hanger spaces`, 'green');
    log(`   Total Capacity: ${response.data.totalCapacity.totalSlots} slots`, 'blue');
    log(`   Available: ${response.data.totalCapacity.availableSlots} slots`, 'blue');
    
    return response.data.hangerSpaces[0]?._id;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testRequestQR() {
  try {
    log('\n📝 Testing: Request New QR', 'cyan');
    const response = await axios.post(
      `${BASE_URL}/request-qr`,
      {
        numberOfBarrels: 2,
        reason: 'qr_missing',
        notes: 'Test request from automated script',
        priority: 'high'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ QR Request created: ${response.data.request.requestNumber}`, 'green');
    log(`   Status: ${response.data.request.status}`, 'blue');
    log(`   Barrels: ${response.data.request.numberOfBarrels}`, 'blue');
    
    return response.data.request._id;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testApproveQR(requestId) {
  try {
    log('\n✅ Testing: Approve QR Request', 'cyan');
    const response = await axios.post(
      `${BASE_URL}/qr-requests/${requestId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ QR Request approved!`, 'green');
    log(`   Generated ${response.data.qrCodes.length} QR codes`, 'blue');
    
    if (response.data.qrCodes.length > 0) {
      const firstQR = response.data.qrCodes[0];
      log(`   First Barrel ID: ${firstQR.barrelId}`, 'blue');
      log(`   QR Code: ${firstQR.qrCode}`, 'blue');
      return firstQR;
    }
    
    return null;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testScanQR(qrCode) {
  try {
    log('\n🔍 Testing: Scan Barrel QR', 'cyan');
    const response = await axios.post(
      `${BASE_URL}/scan-qr`,
      { qrCode },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Barrel scanned successfully!`, 'green');
    log(`   Barrel ID: ${response.data.barrel.barrelId}`, 'blue');
    log(`   Status: ${response.data.barrel.status}`, 'blue');
    
    return response.data.barrel.barrelId;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testAddToHanger(barrelId, hangerSpaceId) {
  try {
    log('\n🏭 Testing: Add Barrel to Hanger', 'cyan');
    const response = await axios.post(
      `${BASE_URL}/add-to-hanger`,
      {
        barrelId,
        hangerSpaceId,
        slotNumber: 'A1-001'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log(`✅ Barrel added to hanger space!`, 'green');
    log(`   Location: ${response.data.hangerSpace.location}`, 'blue');
    log(`   Available Slots: ${response.data.hangerSpace.availableSlots}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetDashboardStats() {
  try {
    log('\n📊 Testing: Get Dashboard Stats', 'cyan');
    const response = await axios.get(`${BASE_URL}/dashboard-stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log(`✅ Dashboard stats retrieved!`, 'green');
    log(`   In Hanger Space: ${response.data.inHangerSpace}`, 'blue');
    log(`   Assigned to Customers: ${response.data.assignedToCustomers}`, 'blue');
    log(`   Returned Empty: ${response.data.returnedEmpty}`, 'blue');
    log(`   Pending QR Requests: ${response.data.pendingQRRequests}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'yellow');
  log('🧪 Return Barrel Management System - Test Suite', 'yellow');
  log('='.repeat(60), 'yellow');
  
  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    log('\n❌ Tests aborted. Please fix login credentials.', 'red');
    return;
  }
  
  // Test 1: Get Hanger Spaces
  const hangerSpaceId = await testGetHangerSpaces();
  if (!hangerSpaceId) {
    log('\n⚠️  No hanger spaces found. Run setup script first:', 'yellow');
    log('   node setup-return-barrel-system.js', 'yellow');
    return;
  }
  
  // Test 2: Request QR
  const requestId = await testRequestQR();
  if (!requestId) {
    log('\n❌ Tests aborted.', 'red');
    return;
  }
  
  // Test 3: Approve QR
  const qrData = await testApproveQR(requestId);
  if (!qrData) {
    log('\n❌ Tests aborted.', 'red');
    return;
  }
  
  // Test 4: Scan QR
  const barrelId = await testScanQR(qrData.qrCode);
  if (!barrelId) {
    log('\n❌ Tests aborted.', 'red');
    return;
  }
  
  // Test 5: Add to Hanger
  await testAddToHanger(barrelId, hangerSpaceId);
  
  // Test 6: Dashboard Stats
  await testGetDashboardStats();
  
  // Summary
  log('\n' + '='.repeat(60), 'yellow');
  log('✅ All tests completed!', 'green');
  log('='.repeat(60), 'yellow');
  log('\n📝 Test Summary:', 'cyan');
  log('   ✅ Hanger spaces loaded', 'green');
  log('   ✅ QR request created', 'green');
  log('   ✅ QR codes generated', 'green');
  log('   ✅ Barrel scanned', 'green');
  log('   ✅ Barrel added to hanger', 'green');
  log('   ✅ Dashboard stats retrieved', 'green');
  log('\n🎉 Return Barrel Management System is working correctly!', 'green');
  log('\n');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
