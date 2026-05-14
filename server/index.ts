import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log the full error for debugging (server-side only)
    console.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      status: status,
      timestamp: new Date().toISOString()
    });
    
    // Send generic error message to client to prevent information disclosure
    let message = "Internal Server Error";
    if (status === 400) {
      message = "Bad Request";
    } else if (status === 401) {
      message = "Unauthorized";
    } else if (status === 403) {
      message = "Forbidden";
    } else if (status === 404) {
      message = "Not Found";
    } else if (status === 429) {
      message = "Too Many Requests";
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Start HTTP server
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🌐 HTTP server serving on port ${port}`);
    log(`📱 Validation page: http://localhost:${port}/validacion (manual testing)`);
  });

  // Start HTTPS server for camera access (development only)
  if (app.get("env") === "development") {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const certPath = path.join(__dirname, '..', 'certs', 'localhost.pem');
      const keyPath = path.join(__dirname, '..', 'certs', 'localhost-key.pem');
      
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const httpsOptions = {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath)
        };
        
        // Create a separate HTTPS app instance
        const httpsApp = express();
        httpsApp.use(express.json());
        httpsApp.use(express.urlencoded({ extended: false }));
        
        // Register routes for HTTPS
        const httpsServer = await registerRoutes(httpsApp);
        
        const httpsServerInstance = https.createServer(httpsOptions, httpsApp);
        
        // Setup Vite for HTTPS with proper HMR configuration
        await setupVite(httpsApp, httpsServerInstance);
        
        httpsServerInstance.listen(5001, () => {
          log(`🔒 HTTPS server serving on port 5001`);
          log(`📱 Camera validation page: https://localhost:5001/validacion`);
        });
      } else {
        log(`⚠️  HTTPS certificates not found. Camera access will not work.`);
        log(`💡 Run: mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1`);
      }
    } catch (error) {
      log(`⚠️  HTTPS setup failed: ${error}`);
    }
  }
})();
