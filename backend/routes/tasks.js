const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get all tasks (Modified for Admin Role)
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, sortBy = 'createdAt', order = 'desc' } = req.query;

    let filter = {};

    // If user is NOT an admin, only show their own tasks
    if (req.user.role !== 'admin') {
      filter.user = req.userId;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const sortOrder = order === 'asc' ? 1 : -1;

    const tasks = await Task.find(filter)
      .sort({ [sortBy]: sortOrder })
      .populate('user', 'name email');

    res.json({ tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get Task Statistics 
router.get('/stats/summary', auth, async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role !== 'admin') {
      matchQuery.user = req.user._id;
    }

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = { total: 0, pending: 0, 'in-progress': 0, completed: 0 };

    stats.forEach(stat => {
      if (summary.hasOwnProperty(stat._id)) {
        summary[stat._id] = stat.count;
      }
      summary.total += stat.count;
    });

    res.json({ stats: summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Update Task (Allow Admin to update any task)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.userId;
    }

    const task = await Task.findOne(query);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();
    await task.populate('user', 'name email');

    const io = req.app.get('io');
    io.emit('taskUpdated', task); 

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete Task (Allow Admin to delete any task)
router.delete('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.userId;
    }

    const task = await Task.findOneAndDelete(query);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const io = req.app.get('io');
    io.emit('taskDeleted', req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.userId;
    }
    const task = await Task.findOne(query).populate('user', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const task = new Task({
      title, description, status, priority, dueDate,
      user: req.userId
    });

    await task.save();
    await task.populate('user', 'name email');

    const io = req.app.get('io');
    io.emit('taskCreated', task);

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

module.exports = router;