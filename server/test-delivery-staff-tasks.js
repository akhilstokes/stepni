// Test script to verify delivery staff can see assigned tasks
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const DeliveryTask = require('./models/deliveryTaskModel');
const User = require('./models/userModel');

async function testDeliveryStaffTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a delivery staff user
    const deliveryStaff = await User.findOne({ role: 'delivery_staff' });
    if (!deliveryStaff) {
      console.log('❌ No delivery staff found in database');
      console.log('Creating a test delivery staff user...');
      
      // Create a test delivery staff user
      const testStaff = await User.create({
        name: 'Test Delivery Staff',
        email: 'delivery@test.com',
        password: 'test123',
        role: 'delivery_staff',
        phoneNumber: '1234567890'
      });
      console.log('✅ Created test delivery staff:', testStaff.name, testStaff._id);
      
      // Find tasks assigned to this user
      const tasks = await DeliveryTask.find({ assignedTo: testStaff._id })
        .populate('customerUserId', 'name email phoneNumber')
        .sort({ createdAt: -1 });
      
      console.log(`\n📋 Tasks assigned to ${testStaff.name}:`, tasks.length);
      if (tasks.length > 0) {
        tasks.forEach((task, i) => {
          console.log(`\nTask ${i + 1}:`);
          console.log('  ID:', task._id);
          console.log('  Title:', task.title);
          console.log('  Status:', task.status);
          console.log('  Pickup:', task.pickupAddress);
          console.log('  Drop:', task.dropAddress);
          console.log('  Customer:', task.customerUserId?.name || 'N/A');
        });
      } else {
        console.log('  No tasks found');
      }
    } else {
      console.log('✅ Found delivery staff:', deliveryStaff.name, deliveryStaff._id);
      
      // Find tasks assigned to this user
      const tasks = await DeliveryTask.find({ assignedTo: deliveryStaff._id })
        .populate('customerUserId', 'name email phoneNumber')
        .sort({ createdAt: -1 });
      
      console.log(`\n📋 Tasks assigned to ${deliveryStaff.name}:`, tasks.length);
      if (tasks.length > 0) {
        tasks.forEach((task, i) => {
          console.log(`\nTask ${i + 1}:`);
          console.log('  ID:', task._id);
          console.log('  Title:', task.title);
          console.log('  Status:', task.status);
          console.log('  Pickup:', task.pickupAddress);
          console.log('  Drop:', task.dropAddress);
          console.log('  Customer:', task.customerUserId?.name || 'N/A');
          console.log('  Meta:', JSON.stringify(task.meta));
        });
      } else {
        console.log('  No tasks found');
      }
    }

    // List all delivery tasks in the system
    console.log('\n\n📊 All Delivery Tasks in System:');
    const allTasks = await DeliveryTask.find()
      .populate('assignedTo', 'name email role')
      .populate('customerUserId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Total tasks: ${allTasks.length}`);
    allTasks.forEach((task, i) => {
      console.log(`\nTask ${i + 1}:`);
      console.log('  ID:', task._id);
      console.log('  Title:', task.title);
      console.log('  Status:', task.status);
      console.log('  Assigned To:', task.assignedTo?.name || 'N/A', `(${task.assignedTo?.role || 'N/A'})`);
      console.log('  Customer:', task.customerUserId?.name || 'N/A');
      console.log('  Created:', task.createdAt);
    });

    // List all users with delivery_staff role
    console.log('\n\n👥 All Delivery Staff Users:');
    const allDeliveryStaff = await User.find({ role: 'delivery_staff' }).select('name email role');
    console.log(`Total delivery staff: ${allDeliveryStaff.length}`);
    allDeliveryStaff.forEach((staff, i) => {
      console.log(`${i + 1}. ${staff.name} (${staff.email}) - ID: ${staff._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testDeliveryStaffTasks();
