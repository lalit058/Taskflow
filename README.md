# Taskflow - Full-Stack Task Management System
A modern, full-stack task management application built with react, Node.js, Express, and MongoDB. Organize, track, and prioritize your daily tasks with real-time status updates and dynamic urgency alerts.

## 🚀 Features
- **Task Management**: Create, update, delete, and toggle completion states for tasks effortlessly.
- **Smart Urgency Indicator**: Color-coded badges and animations alert you when tasks are approaching their due date or overdue:
    - **🔴 Overdue**: Pulsing red alert
    - **🟠 Due < 24 hrs**: High-priority orange warning
    - **🔵 Due < 3 days**: Blue notice

- **Search & Dynamic Filtering**: Filter tasks instantly by status (Pending, In Progress, Completed) or search by title.
- **Responsive Dashboard**: Mobile-first design with responsive multi-column layouts for mobile, tablet, and desktop viewports.
- **Visual Task Metrics**: Quick stats bar displaying total, completed, pending, and in-progress task counts.

## 🛠️ Tech Stack
- **Frontend**: 
    - React(Vite/CRA) 
    - Tailwind CSS(Styling & Responsive Layouts)
    - Lucide React (UI Icons)

- **Backend**: 
    - Node.js & Express.js(Database) 
    - MongoDB with Mongoose(Database)


## ⚡ Getting Started
### Prerequisites
Make sure you have the following installed on your machine:
    - Node.js (v16.x or higher)
    - npm or yarn
    - MongoDB (Local instance or MongoDB Atlas cluster)

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

1. Clone the repo: `git clone https://github.com/lalit058/Taskflow.git`
2. Install dependencies for both folders: `npm install`
3. Set up your `.env` file (JWT_SECRET, MONGODB_URI).
4. Run the server: `npm run dev`
