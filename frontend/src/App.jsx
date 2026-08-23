import React, { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import LoginForm from "./components/LoginForm";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";

// Define GraphQL Query to fetch current user profile with timestamps
const GET_ME = gql`
  query GetMe {
    getMe {
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

// Define GraphQL mutation
const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $email: String, $avatar: String) {
    updateProfile(name: $name, email: $email, avatar: $avatar) {
      id
      name
      email
      avatar
      role
      createdAt
      updatedAt
    }
  }
`;

// Initialize socket connection
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

// API Service
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const api = {
  async register(data) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    avatar: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      let result;
      if (isLogin) {
        result = await api.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        if (!isLogin && formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        result = await api.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          avatar: formData.avatar,
        });
      }

      if (result && result.token) {
        sessionStorage.setItem("token", result.token);
        sessionStorage.setItem("user", JSON.stringify(result.user));
        onLogin(result.token, result.user);
      } else {
        setError(result.error || result.message || "Authentication failed");
      }
    } catch (err) {
      setError("Server error. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      isLogin={isLogin}
      setIsLogin={setIsLogin}
      formData={formData}
      setFormData={setFormData}
      handleSubmit={handleSubmit}
      error={error}
      setError={setError}
      loading={loading}
    />
  );
};

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user") || "null"),
  );

  // Automatically fetch fresh user details including timestamps using getMe query
  useQuery(GET_ME, {
    skip: !token,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data && data.getMe) {
        setUser(data.getMe);
        sessionStorage.setItem("user", JSON.stringify(data.getMe));
      }
    },
    onError: (err) => {
      console.error("Failed to fetch current user profile:", err);
    },
  });

  // Setup Socket.io listener for real-time profile adjustments by admin
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId) {
      socket.emit("join", { userId, role: user.role });

      socket.on("profileUpdated", (data) => {
        toast.success(data.message || "Your profile was updated by an admin!", {
          icon: "👤",
        });

        setUser((prevUser) => {
          const refreshedUser = { ...prevUser, ...data.updatedData };
          sessionStorage.setItem("user", JSON.stringify(refreshedUser));
          return refreshedUser;
        });
      });
    }

    return () => {
      socket.off("profileUpdated");
    };
  }, [user?.id, user?._id]);

  // Define the mutation hook
  const [updateProfileMutation] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      const updatedUser = { ...user, ...data.updateProfile };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    onError: (err) => {
      console.error("❌ Failed to update profile in DB:", err);
    },
  });

  const handleUpdateUser = async (updatedData) => {
    try {
      await updateProfileMutation({
        variables: {
          name: updatedData.name,
          email: updatedData.email,
          avatar: updatedData.avatar,
        },
      });
    } catch (err) {
      console.error("Mutation Execution Error:", err);
    }
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <>
      <Toaster position="top-center" />
      <Dashboard
        user={user}
        token={token}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />
    </>
  );
}
