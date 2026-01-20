// Script to fix delivered but unassigned barrels
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const BarrelRequest = require('./models/barrelRequestModel');
const Barrel = require('./models/barrelModel');
const User = require('./models/userModel'); // Need to load User model for populate

async function fixDeliveredBarrels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all delivered requests with assigned barrels
    const deliveredRequests = await BarrelRequest.find({ 
      deliveryStatus: 'delivered',
      assignedBarrels: { $exists: true, $ne: [] }
    }).populate('user', 'name email');

    console.log(`📦 Found ${deliveredRequests.length} delivered requests with assigned barrels\n`);

    let totalFixed = 0;

    for (const request of deliveredRequests) {
      console.log(`\n🔍 Processing Request ${request._id}`);
      console.log(`   User: ${request.user?.name}`);
      console.log(`   Barrels: ${request.assignedBarrels.join(', ')}`);

      let fixedCount = 0;

      for (const barrelId of request.assignedBarrels) {
        const barrel = await Barrel.findOne({ barrelId: barrelId });
        
        if (barrel) {
          // Check if barrel needs to be assigned
          if (!barrel.assignedTo || barrel.assignedTo.toString() !== request.user._id.toString()) {
            barrel.status = 'in-use';
            barrel.assignedTo = request.user._id;
            barrel.assignedDate = request.deliveredAt || new Date();
            barrel.lastKnownLocation = request.deliveryLocation || 'User Location';
            await barrel.save();
            
            console.log(`   ✅ Fixed ${barrelId} - assigned to user`);
            fixedCount++;
            totalFixed++;
          } else {
            console.log(`   ℹ️  ${barrelId} - already correctly assigned`);
          }
        } else {
          console.log(`   ❌ ${barrelId} - NOT FOUND in database`);
        }
      }

      console.log(`   📊 Fixed ${fixedCount} barrels for this request`);
    }

    console.log(`\n\n✅ COMPLETE! Fixed ${totalFixed} barrels total`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDeliveredBarrels();
