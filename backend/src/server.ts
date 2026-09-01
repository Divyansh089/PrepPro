// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';

import { testConnection } from './config/database';
import { typeDefs } from './graphql/schema/typeDefs';
import { resolvers } from './graphql/resolvers';
import { initWebSocketServer } from './websocket/websocketServer';

const JWT_SECRET = process.env.JWT_SECRET || 'preppro_jwt_secret_key_9f8d7c6b5a4e3f210192837465_prod';
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// CORS setup
const rawOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean).map(o => o.replace(/\/$/, ''));

function originIsAllowed(origin: string | undefined) {
  if (!origin) return false;
  const norm = origin.replace(/\/$/, '');
  return rawOrigins.includes(norm);
}

const corsOptions: cors.CorsOptionsDelegate = (req, callback) => {
  const origin = (req as any).headers?.origin as string | undefined;
  if (!origin) {
    return callback(null, { origin: true, credentials: true, methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] });
  }
  if (originIsAllowed(origin)) {
    const norm = origin.replace(/\/$/, '');
    const matched = rawOrigins.find(o => o === norm) || norm;
    return callback(null, { origin: matched, credentials: true, methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] });
  }
  return callback(null, { origin: false });
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloud Platform Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', engine: '100% Pure GraphQL + WebSockets', graphql: '/graphql', websocket: '/ws' });
});

// Root Information Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'PrepPro 100% GraphQL Backend API & WebSockets Engine',
    version: '3.0.0',
    graphqlEndpoint: 'http://localhost:5000/graphql',
    websocketEndpoint: 'ws://localhost:5000/ws',
    healthCheck: 'http://localhost:5000/health'
  });
});

// Start Apollo GraphQL and HTTP/WebSocket Server
async function startServer() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to MongoDB.');
      process.exit(1);
    }

    // Initialize Apollo Server
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await apolloServer.start();

    // Attach GraphQL middleware at /graphql
    app.use(
      '/graphql',
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          const authHeader = req.headers.authorization || '';
          const token = authHeader.replace('Bearer ', '').trim();
          if (!token) return {};
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
            return { userId: decoded.userId, userEmail: decoded.email };
          } catch (err) {
            return {};
          }
        },
      })
    );

    // Initialize WebSocket server attached to HTTP server
    initWebSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 100% Pure GraphQL & WebSockets Backend running on port ${PORT}`);
      console.log(`⚡ GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`🌐 WebSockets Endpoint: ws://localhost:${PORT}/ws`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
