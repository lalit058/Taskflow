const Task = require("../models/Task");
const User = require("../models/User");

// Helper to safely extract user ID 
const getUserId = (user) => {
  if (!user) return null;
  return user.id || user.userId || user._id;
};

// Helper to format task payload safely for GraphQL
const formatTaskUser = (task) => {
  if (!task) return null;
  const taskObj = task.toObject ? task.toObject() : task;

  if (!taskObj.user) {
    taskObj.user = null; // Clean fallback for deleted users
  } else {
    const rawId = taskObj.user._id || taskObj.user;
    taskObj.user.id = rawId.toString();
  }
  return taskObj;
};

const resolvers = {
  Query: {
    getTasks: async (_, { status }, context) => {
      if (!context.user)
        throw new Error("You must be logged in to view tasks.");

      const userId = getUserId(context.user);

      if (!userId && context.user.role !== "admin") {
        throw new Error("Invalid user session. Please re-authenticate.");
      }

      const filter = {};

      if (context.user.role !== "admin") {
        filter.user = userId;
      }

      if (status) {
        filter.status = status;
      }

      const tasks = await Task.find(filter)
        .sort({ createdAt: -1 })
        .populate({ path: "user", select: "_id name email role avatar" });

      return tasks.map(formatTaskUser);
    },

    getTask: async (_, { id }, context) => {
      if (!context.user) throw new Error("Unauthorized");

      const userId = getUserId(context.user);
      const task = await Task.findById(id).populate({
        path: "user",
        select: "_id name email role avatar",
      });

      if (!task) throw new Error("Task not found");

      const taskOwnerId = task.user ? (task.user._id || task.user).toString() : null;
      if (context.user.role !== "admin" && taskOwnerId !== userId.toString()) {
        throw new Error("You do not have permission to view this task");
      }

      return formatTaskUser(task);
    },
  },

  Mutation: {
    updateProfile: async (_, { name, email, avatar }, context) => {
      if (!context.user) throw new Error("Unauthorized");

      const userId = getUserId(context.user);

      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (email !== undefined) updateFields.email = email;
      if (avatar !== undefined) updateFields.avatar = avatar;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true },
      );

      if (!updatedUser) throw new Error("User not found");

      return {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      };
    },

    createTask: async (
      _,
      { title, description, priority, status, dueDate, assignedUserId },
      context,
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      const currentUserId = getUserId(context.user);
      const targetUserId = (context.user.role === "admin" && assignedUserId)
        ? assignedUserId
        : currentUserId;

      const newTask = new Task({
        title,
        description,
        priority: priority || "medium",
        status: status || "pending",
        dueDate: dueDate,
        user: targetUserId,
      });

      const savedTask = await newTask.save();
      const populatedTask = await savedTask.populate({
        path: "user",
        select: "_id name email role avatar",
      });

      const formattedTask = formatTaskUser(populatedTask);

      // Real-time trigger
      if (context.io) {
        if (context.user.role === "admin") {
          if (formattedTask.user && formattedTask.user.id !== currentUserId.toString()) {
            context.io.to(formattedTask.user.id).emit("taskUpdate", {
              message: `Admin assigned a new task to you: ${title}`,
              action: "created",
            });
          }
        } else {
          const userName = formattedTask.user
            ? formattedTask.user.name
            : "A user";
          context.io.to("admin-room").emit("taskUpdate", {
            message: `${userName} created a new task: ${title}`,
            action: "created",
          });
        }
      }

      return formattedTask;
    },

    updateTask: async (
      _,
      { id, title, description, status, priority, dueDate },
      context,
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      const userId = getUserId(context.user);
      const task = await Task.findById(id);
      if (!task) throw new Error("Task not found");

      const taskOwnerId = task.user ? task.user.toString() : null;

      if (
        context.user.role !== "admin" &&
        taskOwnerId !== userId.toString()
      ) {
        throw new Error("You can only update your own tasks");
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

      await task.save();
      const updatedTask = await task.populate({
        path: "user",
        select: "_id name email role avatar",
      });

      const formattedTask = formatTaskUser(updatedTask);

      if (context.io) {
        if (context.user.role === "admin") {
          if (
            formattedTask.user &&
            formattedTask.user.id !== userId.toString()
          ) {
            context.io.to(formattedTask.user.id).emit("taskUpdate", {
              message: `Admin updated your task: ${formattedTask.title}`,
              action: "updated",
            });
          }
        } else {
          const userName = formattedTask.user
            ? formattedTask.user.name
            : "A user";
          context.io.to("admin-room").emit("taskUpdate", {
            message: `${userName} updated task: ${formattedTask.title}`,
            action: "updated",
          });
        }
      }

      return formattedTask;
    },

    deleteTask: async (_, { id }, context) => {
      if (!context.user) throw new Error("Unauthorized");

      const userId = getUserId(context.user);
      const task = await Task.findById(id).populate({
        path: "user",
        select: "_id name email role avatar",
      });

      if (!task) throw new Error("Task not found");

      const taskOwnerId = task.user
        ? (task.user._id || task.user).toString()
        : null;

      if (context.user.role !== "admin" && taskOwnerId !== userId.toString()) {
        throw new Error("You can only delete your own tasks");
      }

      await Task.findByIdAndDelete(id);

      if (context.io) {
        if (context.user.role === "admin") {
          if (taskOwnerId && taskOwnerId !== userId.toString()) {
            context.io.to(taskOwnerId).emit("taskUpdate", {
              message: `Admin deleted your task: ${task.title}`,
              action: "deleted",
            });
          }
        } else {
          const performerUser = await User.findById(userId);
          const performerName = performerUser ? performerUser.name : "A user";

          context.io.to("admin-room").emit("taskUpdate", {
            message: `${performerName} deleted task: ${task.title}`,
            action: "deleted",
          });
        }
      }

      return formatTaskUser(task);
    },
  },
};

module.exports = resolvers;