const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: String!
    priority: String!
    dueDate: String
    user: User!
    createdAt: String
  }

  type Query {
    # Fetch tasks 
    getTasks(status: String): [Task]
    # Get a single task by ID
    getTask(id: ID!): Task
  }

  type Mutation {
    # Mutation to create a task
    createTask(title: String!, description: String, priority: String, status: String, dueDate: String): Task
    # Mutation to update status
    updateTask(id: ID!, title:String, description: String, status: String, priority: String, dueDate: String ): Task
    deleteTask(id: ID!): Task
  }
`;

module.exports = typeDefs;