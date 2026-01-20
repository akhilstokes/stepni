const DeliveryTask = require('../models/deliveryTaskModel');
const DeliveryIntake = require('../models/deliveryIntakeModel');
const Notification = require('../models/Notification');
const User = require('../models/userModel');
const StaffLocation = require('../models/StaffLocation');
const Shift = require('../models/shiftModel');

// Create a delivery task (admin/manager)
exports.createTask = async (req, res) => {
  try {
    const { title, customerUserId, assignedTo, pickupAddress, dropAddress, scheduledAt, notes, meta } = req.body;
    if (!title || !assignedTo || !pickupAddress || !dropAddress) {
      return res.status(400).json({ message: 'title, assignedTo, pickupAddress and dropAddress are required' });
    }
    const doc = await DeliveryTask.create({ title, customerUserId, assignedTo, pickupAddress, dropAddress, scheduledAt, notes, meta });

    // Notify customer about schedule
    if (customerUserId) {
      await Notification.create({
        userId: customerUserId,
        role: 'user',
        title: 'Pickup Scheduled',
        message: `Pickup scheduled: ${title}`,
        link: '/user/notifications',
        meta: { taskId: doc._id, scheduledAt }
      });
    }

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List all tasks (admin/manager)
exports.listAllTasks = async (req, res) => {
  try {
    const { status, assignedTo, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await DeliveryTask.find(query)
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliveryTask.countDocuments(query);

    return res.json({ items: tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List my tasks (delivery staff)
exports.listMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await DeliveryTask.find({ assignedTo: userId })
      .populate('customerUserId', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DeliveryTask.findById(id)
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DeliveryTask.findByIdAndUpdate(id, req.body, { new: true })
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DeliveryTask.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ message: 'Task deleted successfully' });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update task status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meta } = req.body;

    const task = await DeliveryTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task or is admin/manager
    if (task.assignedTo.toString() !== req.user._id.toString() && 
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = status;
    if (meta) {
      task.meta = { ...task.meta, ...meta };
    }
    await task.save();

    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update my location (delivery staff)
exports.updateMyLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const location = await StaffLocation.findOneAndUpdate(
      { userId },
      { 
        userId, 
        location: { type: 'Point', coordinates: [longitude, latitude] },
        accuracy,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.json(location);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List staff locations (admin/manager)
exports.listStaffLocations = async (req, res) => {
  try {
    const locations = await StaffLocation.find()
      .populate('userId', 'name email role')
      .sort({ updatedAt: -1 });

    return res.json(locations);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List delivered tasks for lab
exports.listDeliveredForLab = async (req, res) => {
  try {
    const tasks = await DeliveryTask.find({ status: 'delivered' })
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role')
      .sort({ updatedAt: -1 });

    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get delivery stats for dashboard
exports.getDeliveryStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks for this delivery staff
    const todayTasks = await DeliveryTask.find({
      assignedTo: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayDeliveries = todayTasks.filter(task => 
      task.meta?.type === 'delivery' || task.title.toLowerCase().includes('delivery')
    ).length;

    const todayPickups = todayTasks.filter(task => 
      task.meta?.type === 'pickup' || task.title.toLowerCase().includes('pickup')
    ).length;

    const completedTasks = todayTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = todayTasks.filter(task => 
      ['assigned', 'in_progress'].includes(task.status)
    ).length;

    // Calculate earnings (mock calculation - adjust based on your business logic)
    const totalEarnings = completedTasks * 100; // ₹100 per completed task

    res.json({
      todayDeliveries,
      todayPickups,
      completedTasks,
      pendingTasks,
      totalEarnings
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ message: 'Failed to fetch delivery stats' });
  }
};

// Get assigned tasks for delivery staff
exports.getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      status: { $in: ['assigned', 'in_progress'] }
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 })
    .limit(10);

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: task.meta?.type || (task.title.toLowerCase().includes('pickup') ? 'pickup' : 'delivery'),
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.pickupAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.pickupAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Failed to fetch assigned tasks' });
  }
};

// Get pending tasks (same as assigned tasks but with different endpoint)
exports.getPendingTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      status: { $in: ['assigned', 'in_progress'] }
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: task.meta?.type || (task.title.toLowerCase().includes('pickup') ? 'pickup' : 'delivery'),
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.pickupAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.pickupAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).json({ message: 'Failed to fetch pending tasks' });
  }
};

// Get today's deliveries
exports.getTodayDeliveries = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      createdAt: { $gte: today, $lt: tomorrow },
      $or: [
        { 'meta.type': 'delivery' },
        { title: { $regex: 'delivery', $options: 'i' } }
      ]
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: 'delivery',
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.dropAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.dropAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ deliveries: transformedTasks });
  } catch (error) {
    console.error('Error fetching today deliveries:', error);
    res.status(500).json({ message: 'Failed to fetch today deliveries' });
  }
};

// Get today's pickups
exports.getTodayPickups = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      createdAt: { $gte: today, $lt: tomorrow },
      $or: [
        { 'meta.type': 'pickup' },
        { title: { $regex: 'pickup', $options: 'i' } }
      ]
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: 'pickup',
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.pickupAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.pickupAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ pickups: transformedTasks });
  } catch (error) {
    console.error('Error fetching today pickups:', error);
    res.status(500).json({ message: 'Failed to fetch today pickups' });
  }
};

// Get earnings data
exports.getEarnings = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date ranges
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get completed tasks for different periods
    const todayTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: { $gte: today, $lt: tomorrow }
    });

    const weekTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: { $gte: weekStart }
    });

    const monthTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: { $gte: monthStart }
    });

    const totalTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed'
    });

    // Calculate earnings (₹100 per completed task - adjust based on your business logic)
    const ratePerTask = 100;
    const summary = {
      today: todayTasks * ratePerTask,
      thisWeek: weekTasks * ratePerTask,
      thisMonth: monthTasks * ratePerTask,
      total: totalTasks * ratePerTask
    };

    // Get recent earnings history
    const recentTasks = await DeliveryTask.find({
      assignedTo: userId,
      status: 'completed'
    })
    .populate('customerUserId', 'name')
    .sort({ updatedAt: -1 })
    .limit(20);

    const history = recentTasks.map(task => ({
      id: task._id,
      date: task.updatedAt,
      task: task.title,
      customer: task.customerUserId?.name || 'Unknown Customer',
      amount: ratePerTask,
      type: task.meta?.type || 'delivery'
    }));

    res.json({ summary, history });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ message: 'Failed to fetch earnings' });
  }
};

// Handle task actions (start, complete, etc.)
exports.handleTaskAction = async (req, res) => {
  try {
    const { id, action } = req.params;
    const userId = req.user._id;
    const { timestamp, location } = req.body;

    const task = await DeliveryTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Handle different actions
    switch (action) {
      case 'start':
        if (task.status !== 'assigned') {
          return res.status(400).json({ message: 'Task cannot be started' });
        }
        task.status = 'in_progress';
        task.meta = { ...task.meta, startedAt: timestamp || new Date() };
        break;

      case 'complete':
        if (task.status !== 'in_progress') {
          return res.status(400).json({ message: 'Task cannot be completed' });
        }
        task.status = 'completed';
        task.meta = { ...task.meta, completedAt: timestamp || new Date() };
        break;

      case 'cancel':
        if (['completed', 'cancelled'].includes(task.status)) {
          return res.status(400).json({ message: 'Task cannot be cancelled' });
        }
        task.status = 'cancelled';
        task.meta = { ...task.meta, cancelledAt: timestamp || new Date() };
        break;

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    // Add location if provided
    if (location) {
      task.meta = { 
        ...task.meta, 
        [`${action}Location`]: location 
      };
    }

    await task.save();

    res.json({
      success: true,
      message: `Task ${action}ed successfully`,
      task: {
        id: task._id,
        status: task.status,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error('Error handling task action:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Barrel intake functions
exports.intakeBarrels = async (req, res) => {
  try {
    const { barrelCount, customerName, customerPhone, notes, barrelIds, taskId, requestId, arrivalTime } = req.body;
    const staffId = req.user._id;

    if (!barrelCount || !customerName) {
      return res.status(400).json({ message: 'barrelCount and customerName are required' });
    }

    const intake = await DeliveryIntake.create({
      createdBy: staffId,
      name: customerName,
      phone: customerPhone,
      barrelCount,
      notes,
      barrelIds: barrelIds || [], // Optional - barrel scanning moved to field staff
      taskId,
      requestId,
      arrivalTime: arrivalTime || new Date(),
      status: 'pending'
    });

    // Automatically update the task status to intake_completed if taskId is provided
    if (taskId) {
      try {
        // Remove 'sr_' prefix if present
        const actualTaskId = taskId.startsWith('sr_') ? taskId.substring(3) : taskId;
        
        // Update task status
        await DeliveryTask.findByIdAndUpdate(actualTaskId, { 
          status: 'intake_completed',
          'meta.intakeId': intake._id,
          'meta.intakeCompletedAt': new Date()
        });
        
        console.log(`Task ${actualTaskId} marked as intake_completed`);
      } catch (updateError) {
        console.error('Error updating task status:', updateError);
        // Don't fail the intake if task update fails
      }
    }

    return res.status(201).json(intake);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listIntakes = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const intakes = await DeliveryIntake.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliveryIntake.countDocuments(query);

    return res.json({ items: intakes, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listMyIntakes = async (req, res) => {
  try {
    const staffId = req.user._id;
    const intakes = await DeliveryIntake.find({ createdBy: staffId })
      .sort({ createdAt: -1 });

    return res.json(intakes);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.verifyIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DeliveryIntake.findById(id);
    if (!doc) return res.status(404).json({ message: 'Intake not found' });
    doc.status = 'manager_verified';
    doc.verifiedAt = new Date();
    doc.verifiedBy = req.user._id;
    await doc.save();

    // Optionally create a Delivery Task if details are provided
    const { assignedTo, pickupAddress, dropAddress, scheduledAt, notes, title } = req.body || {};
    let task = null;
    if (assignedTo && pickupAddress && dropAddress) {
      task = await DeliveryTask.create({
        title: title || `Barrel Pickup (${doc.barrelCount})`,
        customerUserId: req.user._id, // manager initiator; can be updated to actual customer later if needed
        assignedTo,
        pickupAddress,
        dropAddress,
        scheduledAt,
        notes,
        meta: { intakeId: doc._id, barrelCount: doc.barrelCount }
      });
    }

    return res.json({ intake: doc, task });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.approveIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DeliveryIntake.findById(id);
    if (!doc) return res.status(404).json({ message: 'Intake not found' });
    doc.status = 'approved';
    doc.approvedAt = new Date();
    doc.approvedBy = req.user._id;
    await doc.save();

    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.getIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const intake = await DeliveryIntake.findById(id)
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' });
    }

    return res.json(intake);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.updateIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const intake = await DeliveryIntake.findByIdAndUpdate(id, req.body, { new: true })
      .populate('createdBy', 'name email role');

    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' });
    }

    return res.json(intake);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.deleteIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const intake = await DeliveryIntake.findByIdAndDelete(id);

    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' });
    }

    return res.json({ message: 'Intake deleted successfully' });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Sell allowance functions
exports.getMySellAllowance = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('sellAllowance');
    
    return res.json({ 
      sellAllowance: user?.sellAllowance || 0,
      unlimited: !user?.sellAllowance || user.sellAllowance === 0
    });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.setUserSellAllowance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sellAllowance } = req.body;

    if (sellAllowance < 0) {
      return res.status(400).json({ message: 'Sell allowance cannot be negative' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        sellAllowance,
        sellAllowanceUpdatedAt: new Date(),
        sellAllowanceSetBy: req.user._id
      },
      { new: true }
    ).select('name email sellAllowance sellAllowanceUpdatedAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get delivery staff shift schedule
exports.getDeliveryShiftSchedule = async (req, res) => {
  try {
    const staffId = req.user._id;
    
    // Get user with assigned shift
    const user = await User.findById(staffId).populate('assignedShift');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current week dates
      const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all active shifts
    const allShifts = await Shift.find({ isActive: true })
      .populate('assignedStaff', 'name email role')
      .sort({ startTime: 1 });

    // Format all shifts for display
    const formattedShifts = allShifts.map(shift => ({
      _id: shift._id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      duration: shift.duration,
      gracePeriod: shift.gracePeriod,
      description: shift.description,
      isActive: shift.isActive,
      assignedStaffCount: shift.assignedStaff.length
    }));

    // Format my assignment
    let myAssignment = null;
    if (user.assignedShift) {
      const shift = user.assignedShift;
      myAssignment = {
        _id: shift._id,
        name: shift.name,
        shiftType: shift.name.includes('Morning') ? 'Morning' : 
                   shift.name.includes('Evening') ? 'Evening' : 
                   shift.name.includes('Night') ? 'Night' : 'Regular',
        startTime: shift.startTime,
        endTime: shift.endTime,
        duration: shift.duration,
        gracePeriod: shift.gracePeriod,
        description: shift.description,
        days: [0, 1, 2, 3, 4, 5, 6] // Assume working all days, can be customized
      };
    }

    const response = {
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      myAssignment,
      allShifts: formattedShifts
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching delivery shift schedule:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};