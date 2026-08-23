const Task = require("../models/Task");
const User = require("../models/User");

const getUserId = (user) => {
  if (!user) return null;
  return user.id || user.userId || user._id;
};

const formatTaskUser = (task) => {
  if (!task) return null;
  const taskObj = task.toObject ? task.toObject() : task;

  if (!taskObj.user) {
    taskObj.user = null;
  } else {
    const rawId = taskObj.user._id || taskObj.user;
    taskObj.user.id = rawId.toString();
  }

  // Ensure Mongoose dates are serialized as strings for GraphQL compatibility
  return {
    ...taskObj,
    id: taskObj._id ? taskObj._id.toString() : taskObj.id,
    createdAt: taskObj.createdAt
      ? new Date(taskObj.createdAt).toISOString()
      : null,
    updatedAt: taskObj.updatedAt
      ? new Date(taskObj.updatedAt).toISOString()
      : null,
    dueDate: taskObj.dueDate ? new Date(taskObj.dueDate).toISOString() : null,
  };
};

const resolvers = {
  Query: {
    getMe: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const userId = getUserId(context.user);
      const user = await User.findById(userId).select("-password");
      if (!user) throw new Error("User not found");

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      };
    },

    getAllUsers: async (_, __, { user }) => {
      if (!user || user.role !== "admin") {
        throw new Error("Access Denied: Admins only.");
      }
      return await User.find().select("-password");
    },

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

      const taskOwnerId = task.user
        ? (task.user._id || task.user).toString()
        : null;
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
        createdAt: updatedUser.createdAt?.toISOString(),
        updatedAt: updatedUser.updatedAt?.toISOString(),
      };
    },

    updateUser: async (_, { id, name, email, role, avatar }, context) => {
      if (!context.user || context.user.role !== "admin") {
        throw new Error("Access Denied: Admins only.");
      }

      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (email !== undefined) updateFields.email = email;
      if (role !== undefined) updateFields.role = role;
      if (avatar !== undefined) updateFields.avatar = avatar;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true },
      ).select("-password");

      if (!updatedUser) throw new Error("User not found");

      return {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt?.toISOString(),
        updatedAt: updatedUser.updatedAt?.toISOString(),
      };
    },

    createTask: async (
      _,
      { title, description, priority, status, dueDate, assignedUserId },
      context,
    ) => {
      if (!context.user) throw new Error("Unauthorized");

      const currentUserId = getUserId(context.user);
      const targetUserId =
        context.user.role === "admin" && assignedUserId
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

      if (context.io) {
        if (context.user.role === "admin") {
          if (
            formattedTask.user &&
            formattedTask.user.id !== currentUserId.toString()
          ) {
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
      if (context.user.role !== "admin" && taskOwnerId !== userId.toString()) {
        throw new Error("You can only update your own tasks");
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;

      // Explicitly touch updatedAt to guarantee a valid date timestamp
      task.updatedAt = new Date();

      await task.save();

      const updatedTask = await Task.findById(id).populate({
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
