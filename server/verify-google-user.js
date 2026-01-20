const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');
const Bill = require('./models/billModel');

async function verifyGoogleUser() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find akhil user
    const akhilUser = await User.findOne({ 
      email: 'akhilnk856@gmail.com'
    });

    if (!akhilUser) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User Details:');
    console.log('='.repeat(80));
    console.log(`   Name: ${akhilUser.name}`);
    console.log(`   Email: ${akhilUser.email}`);
    console.log(`   Phone: ${akhilUser.phoneNumber}`);
    console.log(`   Role: ${akhilUser.role}`);
    console.log(`   User ID: ${akhilUser._id}`);
    console.log(`   Status: ${akhilUser.status}`);
    console.log('='.repeat(80));
    console.log('');

    // Check bills linked to this user
    console.log('📋 Bills Query:');
    console.log('='.repeat(80));
    console.log(`   Looking for bills with:`);
    console.log(`   - userId: ${akhilUser._id}`);
    console.log(`   - status: manager_verified, approved, or paid`);
    console.log('='.repeat(80));
    console.log('');

    const bills = await Bill.find({
      userId: akhilUser._id,
      status: { $in: ['manager_verified', 'approved', 'paid'] }
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${bills.length} bills\n`);

    if (bills.length === 0) {
      console.log('❌ NO BILLS FOUND!\n');
      
      // Debug: Check all bills
      const allBills = await Bill.find({});
      console.log(`Total bills in database: ${allBills.length}\n`);
      
      allBills.forEach(bill => {
        console.log(`Bill: ${bill.billNumber}`);
        console.log(`  userId: ${bill.userId}`);
        console.log(`  userId type: ${typeof bill.userId}`);
        console.log(`  akhil._id: ${akhilUser._id}`);
        console.log(`  akhil._id type: ${typeof akhilUser._id}`);
        console.log(`  Match: ${bill.userId && bill.userId.toString() === akhilUser._id.toString()}`);
        console.log(`  Status: ${bill.status}`);
        console.log('');
      });
    } else {
      console.log('Bills that should appear:');
      console.log('='.repeat(80));
      bills.forEach((bill, index) => {
        console.log(`\n${index + 1}. ${bill.billNumber}`);
        console.log(`   Customer: ${bill.customerName}`);
        console.log(`   Phone: ${bill.customerPhone}`);
        console.log(`   Status: ${bill.status}`);
        console.log(`   Amount: ₹${bill.totalAmount.toFixed(2)}`);
        console.log(`   Barrels: ${bill.barrelCount}`);
        console.log(`   DRC: ${bill.drcPercent}%`);
        console.log(`   Created: ${bill.createdAt.toLocaleDateString()}`);
      });
      console.log('\n' + '='.repeat(80));
    }

    // Generate test API response
    console.log('\n\n📡 Expected API Response:');
    console.log('='.repeat(80));
    console.log(JSON.stringify({
      success: true,
      bills: bills.map(b => ({
        _id: b._id,
        billNumber: b.billNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        barrelCount: b.barrelCount,
        drcPercent: b.drcPercent,
        totalAmount: b.totalAmount,
        status: b.status,
        createdAt: b.createdAt
      })),
      total: bills.length,
      page: 1,
      limit: 10
    }, null, 2));
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyGoogleUser();
