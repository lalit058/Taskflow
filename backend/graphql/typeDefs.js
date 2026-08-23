const { gql } = require("graphql-tag");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    priority: String!
    dueDate: String
    user: User
    createdAt: String
    updatedAt: String
  }

  type Query {
    # Get current logged-in user profile
    getMe: User
    # Fetch tasks
    getTasks(status: String): [Task!]!
    # Get a single task by ID
    getTask(id: ID!): Task
    # Get all users (Admin only)
    getAllUsers: [User!]!
  }

  type Mutation {
    updateProfile(name: String, email: String, avatar: String): User!

    updateUser(
      id: ID!
      name: String
      email: String
      role: String
      avatar: String
    ): User!

    # Mutation to create a task
    createTask(
      title: String!
      description: String
      priority: String
      status: String
      dueDate: String
    ): Task!

    # Mutation to update task
    updateTask(
      id: ID!
      title: String
      description: String
      status: String
      priority: String
      dueDate: String
    ): Task!

    # Mutation to delete task
    deleteTask(id: ID!): Task!
  }
`;

module.exports = typeDefs;
