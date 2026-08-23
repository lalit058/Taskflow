const cors = require("cors");
const express = require("express");
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const corsOptions = {
  origin: [clientUrl, "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS Middleware
app.use(cors(corsOptions));

// Body Parsers with 10MB limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Socket.IO Setup
const socketIO = require("socket.io");
const io = socketIO(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  socket.on("join", (data) => {
    const { userId, role } = data;
    if (!userId) return;
    socket.join(userId.toString());
    if (role === "admin") {
      socket.join("admin-room");
    }
  });

  // Listen for admin profile modifications and relay to the targeted user
  socket.on("adminProfileUpdate", (data) => {
    const { userId, updatedData, message } = data;
    if (userId) {
      socket.to(userId.toString()).emit("profileUpdated", {
        updatedData,
        message,
      });
    }
  });

  socket.on("disconnect", () => {
    // User disconnected
  });
});

connectDB();

// Set io for potential REST route access
app.set("io", io);

const PORT = process.env.PORT || 5000;

// Apollo server setup
const startApolloServer = async () => {
  try {
    const { ApolloServer } = await import("@apollo/server");
    const { ApolloServerPluginDrainHttpServer } =
      await import("@apollo/server/plugin/drainHttpServer");
    const { expressMiddleware } = await import("@as-integrations/express5");

    const typeDefs = require("./graphql/typeDefs");
    const resolvers = require("./graphql/resolvers");

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer: server })],
    });

    await apolloServer.start();

    // GraphQL Route with 10MB JSON limit
    app.use(
      "/graphql",
      cors(corsOptions),
      express.json({ limit: "10mb" }),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          const authHeader = req.headers.authorization || "";
          const token = authHeader.replace("Bearer ", "");

          let currentUser = null;

          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              currentUser = {
                id: decoded.userId,
                role: decoded.role,
              };
            } catch (err) {
              console.error("JWT Verification Error:", err.message);
            }
          }

          return {
            user: currentUser,
            io: io,
          };
        },
      }),
    );

    console.log(`GraphQL ready at http://localhost:${PORT}/graphql`);
  } catch (error) {
    console.error("Apollo Startup Error:", error.message);
  }
};

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Server Initialization
startApolloServer();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the server instance for Vercel functions
module.exports = server;