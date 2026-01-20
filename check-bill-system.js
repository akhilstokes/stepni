// Check Bill System Setup
// Run this with: node check-bill-system.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Bill System Setup...\n');

const files = [
  { path: 'server/models/billModel.js', name: 'Bill Model' },
  { path: 'server/controllers/billController.js', name: 'Bill Controller' },
  { path: 'server/routes/billRoutes.js', name: 'Bill Routes' },
  { path: 'client/src/pages/manager/ManagerBillVerification.js', name: 'Manager Bill Verification Page' },
  { path: 'client/src/pages/manager/ManagerBillVerification.css', name: 'Manager Bill Verification CSS' },
  { path: 'client/src/pages/user_dashboard/UserBills.jsx', name: 'User Bills Page' },
];

let allFilesExist = true;

files.forEach(file => {
  const exists = fs.existsSync(file.path);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file.name}`);
  if (!exists) {
    console.log(`   Missing: ${file.path}`);
    allFilesExist = false;
  }
});

console.log('\n📋 Checking server.js for bill routes registration...');
const serverPath = 'server/server.js';
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  if (serverContent.includes("app.use('/api/bills'")) {
    console.log('✅ Bill routes registered in server.js');
  } else {
    console.log('❌ Bill routes NOT registered in server.js');
    console.log('   Add this line: app.use(\'/api/bills\', require(\'./routes/billRoutes\'));');
    allFilesExist = false;
  }
} else {
  console.log('❌ server/server.js not found');
  allFilesExist = false;
}

console.log('\n📋 Checking App.js for routes...');
const appPath = 'client/src/App.js';
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  const checks = [
    { text: 'ManagerBillVerification', name: 'Manager Bill Verification import' },
    { text: 'UserBills', name: 'User Bills import' },
    { text: '/manager/bill-verification', name: 'Manager bill verification route' },
    { text: '/user/bills', name: 'User bills route' }
  ];
  
  checks.forEach(check => {
    if (appContent.includes(check.text)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} missing`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ client/src/App.js not found');
  allFilesExist = false;
}

console.log('\n📋 Checking Manager Dashboard Layout...');
const managerLayoutPath = 'client/src/layouts/ManagerDashboardLayout.js';
if (fs.existsSync(managerLayoutPath)) {
  const layoutContent = fs.readFileSync(managerLayoutPath, 'utf8');
  if (layoutContent.includes('/manager/bill-verification')) {
    console.log('✅ Bill Verification menu item added');
  } else {
    console.log('❌ Bill Verification menu item missing');
    allFilesExist = false;
  }
} else {
  console.log('❌ Manager Dashboard Layout not found');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(60));
if (allFilesExist) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\n📝 Next Steps:');
  console.log('1. Restart the server: cd server && npm start');
  console.log('2. Login as Accountant');
  console.log('3. Go to Delivery Intake page');
  console.log('4. Test bill creation');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\n📝 Please fix the issues above and run this script again.');
}
console.log('='.repeat(60) + '\n');
