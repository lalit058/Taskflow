const Task = require('../models/Task');
const User = require('../models/User');

const resolvers = {
  Query: {
    getTasks: async (_, { status }, context) => {

      if (!context.user) throw new Error('You must be logged in to view tasks.');

      let filter = {};
      if (context.user.role !== 'admin') {
        filter.user = context.user.id;
      }
      return await Task.find(filter).sort({ createdAt: -1 }).populate('user');
    },

  },

  Mutation: {
    createTask: async (_, { title, description, priority, status, dueDate }, context) => {
      if (!context.user) throw new Error('Unauthorized');

      const newTask = new Task({
        title,
        description,
        priority: priority || 'medium',
        status: status || 'pending',
        dueDate: dueDate,
        user: context.user.id
      });
      const savedTask = await newTask.save();
      const populatedTask = await savedTask.populate('user');

      // Real-time trigger 
      if (context.io) {
        if (context.user.role === 'admin') {
          context.io.to(populatedTask.user._id.toString()).emit('taskUpdate', {
            message: `Admin assigned a new task to you: ${title}`,
            action: 'created'
          });
        } else {
          context.io.to('admin-room').emit('taskUpdate', {
            message: `${populatedTask.user.name} created a new task: ${title}`,
            action: 'created'
          });
        }
      }

      return populatedTask;
    },

    updateTask: async (_, { id, title, description, status, priority, dueDate }, context) => {
      if (!context.user) throw new Error('Unauthorized');

      const task = await Task.findById(id);
      if (!task) throw new Error('Task not found');

      if (context.user.role !== 'admin' && task.user.toString() !== context.user.id) {
        throw new Error('You can only update your own tasks');
      }

      // Update allowed fields 
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

      await task.save();
      const updatedTask = await task.populate('user');

      if (context.io) {
        if (context.user.role === 'admin') {
          // Check: Only send if the Admin is NOT the owner of the task
          if (updatedTask.user._id.toString() !== context.user.id.toString()) {
            context.io.to(updatedTask.user._id.toString()).emit('taskUpdate', {
              message: `Admin updated your task: ${updatedTask.title}`,
              action: 'updated'
            });
          }
        } else {
          context.io.to('admin-room').emit('taskUpdate', {
            message: `${updatedTask.user.name} updated task: ${updatedTask.title}`,
            action: 'updated'
          });
        }
      }

      return updatedTask;
    },

    deleteTask: async (_, { id }, context) => {
      if (!context.user) throw new Error('Unauthorized');

      const task = await Task.findById(id);
      if (!task) throw new Error('Task not found');

      // Only admin or owner can delete
      if (context.user.role !== 'admin' && task.user.toString() !== context.user.id) {
        throw new Error('You can only delete your own tasks');
      }

      const updateTask = await User.findById(context.user.id);
      const Performer = updateTask ? updateTask.name : "A user";

      await Task.findByIdAndDelete(id);

      if (context.io) {
        if (context.user.role === 'admin') {
          // Notifies the specific user
          context.io.to(task.user._id.toString()).emit('taskUpdate', {
            message: `Admin deleted your task: ${task.title}`,
            action: 'deleted'
          });
        } else {
          context.io.to('admin-room').emit('taskUpdate', {
            message: `${Performer} deleted task: ${task.title}`,
            action: 'deleted'
          });
        }
      }
      return task;
    }
  }
};

module.exports = resolvers;