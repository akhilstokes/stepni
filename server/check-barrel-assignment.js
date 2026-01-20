// Diagnostic script to check barrel assignments
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const BarrelRequest = require('./models/barrelRequestModel');
const Barrel = require('./models/barrelModel');
const User = require('./models/userModel');

async function checkBarrelAssignments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find recent delivered requests
    const deliveredRequests = await BarrelRequest.find({ 
      deliveryStatus: 'delivered' 
    })
    .populate('user', 'name email')
    .sort({ deliveredAt: -1 })
    .limit(5);

    console.log(`📦 Found ${deliveredRequests.length} delivered requests\n`);

    for (const request of deliveredRequests) {
      console.log('─'.repeat(80));
      console.log(`\n🔍 Request ID: ${request._id}`);
      console.log(`👤 User: ${request.user?.name || 'Unknown'} (${request.user?._id})`);
      console.log(`📅 Delivered: ${request.deliveredAt}`);
      console.log(`📦 Quantity: ${request.quantity}`);
      console.log(`🏷️  Assigned Barrel IDs: ${request.assignedBarrels?.join(', ') || 'None'}\n`);

      if (request.assignedBarrels && request.assignedBarrels.length > 0) {
        console.log('Checking each barrel in database:\n');
        
        for (const barrelId of request.assignedBarrels) {
          const barrel = await Barrel.findOne({ barrelId: barrelId });
          
          if (barrel) {
            console.log(`  ✅ ${barrelId}:`);
            console.log(`     Status: ${barrel.status}`);
            console.log(`     Assigned To: ${barrel.assignedTo || 'None'}`);
            console.log(`     Assigned Date: ${barrel.assignedDate || 'None'}`);
            
            // Check if assigned to correct user
            if (barrel.assignedTo && barrel.assignedTo.toString() === request.user._id.toString()) {
              console.log(`     ✓ Correctly assigned to user`);
            } else if (barrel.assignedTo) {
              console.log(`     ⚠️  Assigned to different user: ${barrel.assignedTo}`);
            } else {
              console.log(`     ❌ NOT assigned to any user!`);
            }
          } else {
            console.log(`  ❌ ${barrelId}: NOT FOUND IN DATABASE!`);
          }
          console.log('');
        }

        // Check what barrels the user actually has
        const userBarrels = await Barrel.find({ assignedTo: request.user._id });
        console.log(`\n📊 User's actual barrels in database: ${userBarrels.length}`);
        if (userBarrels.length > 0) {
          console.log('User barrel IDs:');
          userBarrels.forEach(b => {
            console.log(`  - ${b.barrelId} (status: ${b.status})`);
          });
        }
      }
      console.log('\n');
    }

    // Summary: Check all barrels in database
    console.log('─'.repeat(80));
    console.log('\n📊 BARREL DATABASE SUMMARY\n');
    
    const totalBarrels = await Barrel.countDocuments();
    const inUseBarrels = await Barrel.countDocuments({ status: 'in-use' });
    const assignedBarrels = await Barrel.countDocuments({ assignedTo: { $exists: true, $ne: null } });
    
    console.log(`Total barrels in database: ${totalBarrels}`);
    console.log(`Barrels with status "in-use": ${inUseBarrels}`);
    console.log(`Barrels assigned to users: ${assignedBarrels}\n`);

    // Show sample barrel IDs
    const sampleBarrels = await Barrel.find().limit(10).select('barrelId status assignedTo');
    console.log('Sample barrel IDs in database:');
    sampleBarrels.forEach(b => {
      console.log(`  - ${b.barrelId} (status: ${b.status}, assigned: ${b.assignedTo ? 'Yes' : 'No'})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBarrelAssignments();
