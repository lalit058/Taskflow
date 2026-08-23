import { gql } from "@apollo/client";

export const Update_Profile = gql`
  mutation UpdateProfile($name: String, $email: String, $avatar: String) {
    updateProfile(name: $name, email: $email, avatar: $avatar) {
      id
      name
      email
      role
      avatar
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser(
    $id: ID!
    $name: String
    $email: String
    $role: String
    $avatar: String
  ) {
    updateUser(
      id: $id
      name: $name
      email: $email
      role: $role
      avatar: $avatar
    ) {
      id
      name
      email
      role
      avatar
      createdAt
      updatedAt
    }
  }
`;

export const Get_Tasks = gql`
  query GetTasks($status: String) {
    getTasks(status: $status) {
      id
      title
      description
      status
      priority
      dueDate
      user {
        id
        name
        email
        role
        avatar
      }
      createdAt
      updatedAt
    }
  }
`;

export const Create_Task = gql`
  mutation CreateTask(
    $title: String!
    $description: String
    $status: String
    $priority: String
    $dueDate: String
  ) {
    createTask(
      title: $title
      description: $description
      status: $status
      priority: $priority
      dueDate: $dueDate
    ) {
      id
      title
      description
      status
      priority
      dueDate
      user {
        id
        name
        email
        role
        avatar
      }
    }
  }
`;

export const Update_Task = gql`
  mutation UpdateTask(
    $id: ID!
    $title: String
    $description: String
    $status: String
    $priority: String
    $dueDate: String
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      status: $status
      priority: $priority
      dueDate: $dueDate
    ) {
      id
      title
      description
      status
      priority
      dueDate
      User {
        id
        name
        email
        role
        avatar
      }
    }
  }
`;

export const Delete_Task = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      id
      title
      user {
        id
        name
      }
    }
  }
`;
