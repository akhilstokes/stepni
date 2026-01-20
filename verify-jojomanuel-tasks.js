// Verify jojomanuel can see assigned tasks
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const DeliveryTask = require('./models/deliveryTaskModel');
const User = require('./models/userModel');

async function verifyJojomanuelTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find jojomanuel user
    const jojomanuel = await User.findOne({ email: 'jojo2001p@gmail.com' });
    
    if (!jojomanuel) {
      console.log('❌ jojomanuel user not found');
      return;
    }

    console.log('✅ Found user: jojomanuel');
    console.log('   ID:', jojomanuel._id);
    console.log('   Email:', jojomanuel.email);
    console.log('   Role:', jojomanuel.role);
    console.log('');

    // Find all tasks assigned to jojomanuel
    const tasks = await DeliveryTask.find({ assignedTo: jojomanuel._id })
      .populate('customerUserId', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    console.log(`📋 Tasks assigned to jojomanuel: ${tasks.length}\n`);

    if (tasks.length === 0) {
      console.log('⚠️  No tasks found for jojomanuel');
      console.log('   This means the manager assignment did not create a task yet.');
      console.log('   Please click "ASSIGN STAFF" button in the manager interface.');
    } else {
      tasks.forEach((task, i) => {
        console.log(`Task ${i + 1}:`);
        console.log('  ID:', task._id);
        console.log('  Title:', task.title);
        console.log('  Status:', task.status);
        console.log('  Pickup:', task.pickupAddress);
        console.log('  Drop:', task.dropAddress);
        console.log('  Customer:', task.customerUserId?.name || 'N/A');
        console.log('  Created:', task.createdAt);
        console.log('  Meta:', JSON.stringify(task.meta));
        
        // Check if location data exists
        if (task.pickupLocation && task.pickupLocation.coordinates) {
          console.log('  📍 GPS Location:', task.pickupLocation.coordinates);
        } else {
          console.log('  📍 GPS Location: Not available');
        }
        console.log('');
      });
    }

    // Show most recent tasks in the system
    console.log('\n📊 Most Recent Tasks (Last 5):');
    const recentTasks = await DeliveryTask.find()
      .populate('assignedTo', 'name email')
      .populate('customerUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    recentTasks.forEach((task, i) => {
      console.log(`\n${i + 1}. ${task.title}`);
      console.log('   Assigned To:', task.assignedTo?.name || 'N/A');
      console.log('   Customer:', task.customerUserId?.name || 'N/A');
      console.log('   Status:', task.status);
      console.log('   Created:', task.createdAt);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

verifyJojomanuelTasks();
