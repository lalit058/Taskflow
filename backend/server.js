const cors = require('cors');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set io on the app instance for potential REST route access
app.set('io', io);

const PORT = process.env.PORT || 5000;

// --- APOLLO SERVER SETUP ---
const startApolloServer = async () => {
  try {
    const { ApolloServer } = await import('@apollo/server');
    const { ApolloServerPluginDrainHttpServer } = await import('@apollo/server/plugin/drainHttpServer');
    const { expressMiddleware } = await import('@as-integrations/express5');

    const typeDefs = require('./graphql/typeDefs');
    const resolvers = require('./graphql/resolvers');

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer: server })],
    });

    await apolloServer.start();

    // 3. Apply GraphQL Middleware with UPDATED CONTEXT
    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          const authHeader = req.headers.authorization || '';
          const token = authHeader.replace('Bearer ', '');

          let currentUser = null;

          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              currentUser = {
                id: decoded.userId,
                role: decoded.role
              };
            } catch (err) {
              console.error('JWT Verification Error:', err.message);
            }
          }

          // Return the context object used by Resolvers
          return {
            user: currentUser,
            io: io // <--- Passing the Socket.io instance to all resolvers
          };
        },
      })
    );

    console.log(`GraphQL ready at http://localhost:${PORT}/graphql`);
  } catch (error) {
    console.error('Apollo Startup Error:', error.message);
  }
};

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.io connection logic
io.on('connection', (socket) => {

  // Join a private room based on User ID for targeted notifications
  socket.on('join', (data) => {
    const { userId, role } = data;

    if (!userId) return;
    socket.join(userId.toString());
    console.log(`User ${userId} joined private room`);

    if (role === 'admin') {
      socket.join('admin-room');
      console.log(`Admin ${userId} joined the admin-room`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
startApolloServer().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});