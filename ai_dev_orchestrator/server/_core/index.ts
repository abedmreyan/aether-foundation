import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { GoogleTasksSync } from "../services/googleTasksSync";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

let googleTasksSync: GoogleTasksSync | null = null;

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Initialize Google Tasks sync service
  await initializeGoogleTasksSync();

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    if (googleTasksSync) {
      await googleTasksSync.stop();
    }
    
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function initializeGoogleTasksSync() {
  const taskListId = process.env.GOOGLE_TASKS_LIST_ID;
  const autoSync = process.env.GOOGLE_TASKS_AUTO_SYNC === 'true';

  if (!taskListId) {
    console.log('⚠️  Google Tasks not configured. Run setup script:');
    console.log('   npx tsx scripts/setup-google-tasks.ts');
    return;
  }

  if (!autoSync) {
    console.log('ℹ️  Google Tasks auto-sync disabled');
    return;
  }

  try {
    console.log('🔄 Initializing Google Tasks sync service...');
    
    googleTasksSync = new GoogleTasksSync({
      taskListId,
      syncInterval: parseInt(process.env.GOOGLE_TASKS_SYNC_INTERVAL || '15'),
      autoSync: true,
    });

    await googleTasksSync.start();
    
    console.log('✅ Google Tasks sync service started');
  } catch (error) {
    console.error('❌ Failed to start Google Tasks sync:', error);
    console.log('   Tasks will not sync automatically');
  }
}

startServer().catch(console.error);
