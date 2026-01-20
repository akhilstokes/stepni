const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Bill = require('./server/models/billModel');
const User = require('./server/models/userModel');

async function testBillsSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check all bills
    console.log('📋 ALL BILLS IN DATABASE:');
    console.log('=' .repeat(80));
    const allBills = await Bill.find({})
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 });
    
    if (allBills.length === 0) {
      console.log('❌ No bills found in database!\n');
    } else {
      allBills.forEach((bill, index) => {
        console.log(`\n${index + 1}. Bill: ${bill.billNumber}`);
        console.log(`   Customer: ${bill.customerName} (${bill.customerPhone})`);
        console.log(`   Status: ${bill.status}`);
        console.log(`   Amount: ₹${bill.totalAmount}`);
        console.log(`   Created By: ${bill.createdBy?.name} (${bill.createdBy?.role})`);
        console.log(`   User Linked: ${bill.userId ? `✅ ${bill.userId.name} (${bill.userId.phoneNumber})` : '❌ NO USER LINKED'}`);
        console.log(`   Created At: ${bill.createdAt}`);
      });
      console.log('\n');
    }

    // 2. Check pending bills (for manager)
    console.log('⏳ PENDING BILLS (Manager should see):');
    console.log('=' .repeat(80));
    const pendingBills = await Bill.find({ status: 'pending' });
    console.log(`Found ${pendingBills.length} pending bills`);
    pendingBills.forEach(bill => {
      console.log(`  - ${bill.billNumber}: ${bill.customerName} - ₹${bill.totalAmount}`);
    });
    console.log('\n');

    // 3. Check verified bills (users should see)
    console.log('✅ VERIFIED BILLS (Users should see):');
    console.log('=' .repeat(80));
    const verifiedBills = await Bill.find({ 
      status: { $in: ['manager_verified', 'approved', 'paid'] }
    });
    console.log(`Found ${verifiedBills.length} verified bills`);
    verifiedBills.forEach(bill => {
      console.log(`  - ${bill.billNumber}: ${bill.customerName} - ₹${bill.totalAmount} - User: ${bill.userId ? '✅' : '❌'}`);
    });
    console.log('\n');

    // 4. Check users with phone numbers
    console.log('👥 USERS WITH PHONE NUMBERS:');
    console.log('=' .repeat(80));
    const users = await User.find({ role: 'user' }).select('name email phoneNumber').limit(10);
    console.log(`Found ${users.length} users (showing first 10):`);
    users.forEach(user => {
      console.log(`  - ${user.name}: ${user.phoneNumber} (${user.email})`);
    });
    console.log('\n');

    // 5. Check if phone numbers match
    console.log('🔍 PHONE NUMBER MATCHING CHECK:');
    console.log('=' .repeat(80));
    for (const bill of allBills) {
      if (bill.customerPhone && bill.customerPhone !== 'N/A' && bill.customerPhone !== '-') {
        const cleanPhone = bill.customerPhone.replace(/\D/g, '');
        const matchingUser = await User.findOne({
          $or: [
            { phoneNumber: bill.customerPhone },
            { phoneNumber: cleanPhone },
            { phoneNumber: `+91${cleanPhone}` },
            { phoneNumber: `91${cleanPhone}` },
            { phoneNumber: `0${cleanPhone}` }
          ]
        }).select('name phoneNumber');
        
        console.log(`Bill ${bill.billNumber} (${bill.customerPhone}):`);
        if (matchingUser) {
          console.log(`  ✅ Found user: ${matchingUser.name} (${matchingUser.phoneNumber})`);
          if (!bill.userId) {
            console.log(`  ⚠️  WARNING: User found but bill.userId is NOT set!`);
          }
        } else {
          console.log(`  ❌ No matching user found`);
        }
      }
    }
    console.log('\n');

    // 6. Summary
    console.log('📊 SUMMARY:');
    console.log('=' .repeat(80));
    console.log(`Total Bills: ${allBills.length}`);
    console.log(`Bills with userId: ${allBills.filter(b => b.userId).length}`);
    console.log(`Bills without userId: ${allBills.filter(b => !b.userId).length}`);
    console.log(`Pending Bills: ${pendingBills.length}`);
    console.log(`Verified Bills: ${verifiedBills.length}`);
    console.log('\n');

    // 7. Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('=' .repeat(80));
    const billsWithoutUser = allBills.filter(b => !b.userId);
    if (billsWithoutUser.length > 0) {
      console.log('⚠️  Some bills are not linked to users:');
      billsWithoutUser.forEach(bill => {
        console.log(`   - ${bill.billNumber}: ${bill.customerName} (${bill.customerPhone})`);
      });
      console.log('\n   To fix: Create new bills with correct phone numbers');
      console.log('   OR manually update bills in database with userId');
    }
    
    if (verifiedBills.length === 0 && allBills.length > 0) {
      console.log('⚠️  No verified bills found. Manager needs to verify pending bills.');
    }
    
    if (allBills.length === 0) {
      console.log('⚠️  No bills in database. Create a bill as accountant first.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testBillsSystem();
