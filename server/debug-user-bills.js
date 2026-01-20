const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');
const Bill = require('./models/billModel');

async function debugUserBills() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find akhil user
    const akhilUser = await User.findOne({ 
      name: /akhil/i,
      role: 'user'
    });

    if (!akhilUser) {
      console.log('❌ User "akhil N.K" not found');
      return;
    }

    console.log('✅ Found User:');
    console.log(`   Name: ${akhilUser.name}`);
    console.log(`   Email: ${akhilUser.email}`);
    console.log(`   Phone: ${akhilUser.phoneNumber}`);
    console.log(`   Role: ${akhilUser.role}`);
    console.log(`   ID: ${akhilUser._id}\n`);

    // Find all bills
    console.log('📋 ALL BILLS IN DATABASE:\n');
    const allBills = await Bill.find({});
    console.log(`Total bills: ${allBills.length}\n`);
    
    allBills.forEach(bill => {
      console.log(`Bill: ${bill.billNumber}`);
      console.log(`  Customer: ${bill.customerName}`);
      console.log(`  Phone: ${bill.customerPhone}`);
      console.log(`  Status: ${bill.status}`);
      console.log(`  userId: ${bill.userId || 'NOT SET'}`);
      console.log(`  userId matches akhil: ${bill.userId && bill.userId.toString() === akhilUser._id.toString() ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    // Find bills that SHOULD show for user (manager_verified, approved, paid)
    console.log('\n📋 BILLS THAT SHOULD SHOW FOR USER:\n');
    const userBills = await Bill.find({
      userId: akhilUser._id,
      status: { $in: ['manager_verified', 'approved', 'paid'] }
    });

    console.log(`Found ${userBills.length} bills\n`);
    
    if (userBills.length === 0) {
      console.log('❌ NO BILLS FOUND FOR USER!\n');
      console.log('Checking why...\n');
      
      // Check bills with userId
      const billsWithUserId = await Bill.find({ userId: akhilUser._id });
      console.log(`Bills with userId: ${billsWithUserId.length}`);
      
      if (billsWithUserId.length > 0) {
        console.log('Bills exist but wrong status:');
        billsWithUserId.forEach(b => {
          console.log(`  ${b.billNumber} - Status: ${b.status}`);
        });
      }
      
      // Check bills with correct status but no userId
      const billsWithStatus = await Bill.find({
        status: { $in: ['manager_verified', 'approved', 'paid'] }
      });
      console.log(`\nBills with correct status: ${billsWithStatus.length}`);
      billsWithStatus.forEach(b => {
        console.log(`  ${b.billNumber} - userId: ${b.userId || 'NOT SET'}`);
      });
    } else {
      userBills.forEach(bill => {
        console.log(`✅ ${bill.billNumber}`);
        console.log(`   Customer: ${bill.customerName}`);
        console.log(`   Status: ${bill.status}`);
        console.log(`   Amount: ₹${bill.totalAmount}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugUserBills();
