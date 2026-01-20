// Test script to check lab incoming barrel intake requests
// Run with: node test-lab-incoming-requests.js

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hfp';

async function testLabIncomingRequests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Import models
    const DeliveryIntake = require('./server/models/deliveryIntakeModel');
    const User = require('./server/models/userModel');

    // Check total intake records
    const totalIntakes = await DeliveryIntake.countDocuments();
    console.log(`Total intake records: ${totalIntakes}`);

    // Check pending intakes
    const pendingIntakes = await DeliveryIntake.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    
    console.log(`\nPending intake records: ${pendingIntakes.length}`);
    
    if (pendingIntakes.length > 0) {
      console.log('\n=== Pending Intakes ===');
      pendingIntakes.forEach((intake, index) => {
        console.log(`\n${index + 1}. Intake ID: ${intake._id}`);
        console.log(`   Customer: ${intake.name}`);
        console.log(`   Phone: ${intake.phone || 'N/A'}`);
        console.log(`   Barrel Count: ${intake.barrelCount}`);
        console.log(`   Request ID: ${intake.requestId || 'N/A'}`);
        console.log(`   Status: ${intake.status}`);
        console.log(`   Created By: ${intake.createdBy?.name || 'Unknown'} (${intake.createdBy?.role || 'N/A'})`);
        console.log(`   Created At: ${intake.createdAt}`);
        console.log(`   Arrival Time: ${intake.arrivalTime || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️  No pending intake records found!');
      console.log('\nTo create a test intake:');
      console.log('1. Log in as delivery staff');
      console.log('2. Go to My Tasks');
      console.log('3. Click "Barrel Intake" on a task');
      console.log('4. Complete the 3-step process');
      console.log('5. Click "Send to Lab Staff & Accountant"');
    }

    // Check all intakes (any status)
    const allIntakes = await DeliveryIntake.find()
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (allIntakes.length > 0) {
      console.log(`\n\n=== Recent Intakes (All Statuses) ===`);
      allIntakes.forEach((intake, index) => {
        console.log(`\n${index + 1}. ${intake.name} - ${intake.barrelCount} barrels`);
        console.log(`   Status: ${intake.status}`);
        console.log(`   Created: ${intake.createdAt}`);
      });
    }

    // Check lab users
    const labUsers = await User.find({ 
      role: { $in: ['lab', 'lab_staff', 'lab_manager'] } 
    }).select('name email role');
    
    console.log(`\n\n=== Lab Users ===`);
    console.log(`Found ${labUsers.length} lab users:`);
    labUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testLabIncomingRequests();
