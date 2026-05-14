import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function asBoolean(value: string | undefined, defaultValue = false) {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function authEvent(event: string, req: any, details: Record<string, unknown> = {}) {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
    email: normalizeEmail(req.body?.email) || undefined,
    userAgent: typeof req.headers?.["user-agent"] === "string"
      ? req.headers["user-agent"].slice(0, 120)
      : undefined,
    ...details,
  };

  console.info("[auth]", JSON.stringify(payload));
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  const useLimiterV2 = asBoolean(process.env.AUTH_LIMITER_V2, true);
  const requireSessionSecretInProd = asBoolean(process.env.REQUIRE_SESSION_SECRET_IN_PROD, true);

  // Prevent session invalidation on restarts by requiring a persistent secret in production.
  if (isProduction && requireSessionSecretInProd && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production");
  }

  const sessionSecret = process.env.SESSION_SECRET || randomBytes(64).toString("hex");

  const limiterMessage = { message: "Too many authentication attempts, please try again later" };
  const defaultWindowMs = 15 * 60 * 1000;
  const defaultMaxAttempts = 5;
  const loginMaxAttempts = Number.parseInt(process.env.AUTH_LOGIN_MAX_ATTEMPTS || "5", 10);
  const registerMaxAttempts = Number.parseInt(process.env.AUTH_REGISTER_MAX_ATTEMPTS || "12", 10);

  const authLimiter = rateLimit({
    windowMs: defaultWindowMs,
    max: defaultMaxAttempts,
    message: limiterMessage,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip || ""),
    handler: (req, res) => {
      authEvent("auth_rate_limited_shared", req);
      res.status(429).json(limiterMessage);
    },
  });

  const loginLimiter = rateLimit({
    windowMs: defaultWindowMs,
    max: Number.isNaN(loginMaxAttempts) ? 5 : loginMaxAttempts,
    message: limiterMessage,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ipKey = ipKeyGenerator(req.ip || "");
      const email = normalizeEmail(req.body?.email);
      return email ? `${ipKey}:${email}` : ipKey;
    },
    handler: (req, res) => {
      authEvent("login_rate_limited", req);
      res.status(429).json(limiterMessage);
    },
  });

  const registerLimiter = rateLimit({
    windowMs: defaultWindowMs,
    max: Number.isNaN(registerMaxAttempts) ? 12 : registerMaxAttempts,
    message: limiterMessage,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ipKey = ipKeyGenerator(req.ip || "");
      const email = normalizeEmail(req.body?.email);
      return email ? `${ipKey}:${email}` : ipKey;
    },
    handler: (req, res) => {
      authEvent("register_rate_limited", req);
      res.status(429).json(limiterMessage);
    },
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && process.env.HTTPS === "true",
      sameSite: "lax",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", useLimiterV2 ? registerLimiter : authLimiter, async (req, res, next) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        authEvent("register_duplicate_email", req);
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        authEvent("register_validation_failed", req, { issues: error.errors.length });
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", useLimiterV2 ? loginLimiter : authLimiter, (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        authEvent("login_validation_failed", req, { issues: error.errors.length });
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
    }
    
    passport.authenticate("local", (err: any, user: SelectUser | false) => {
      if (err) return next(err);
      if (!user) {
        authEvent("login_failed_invalid_credentials", req);
        return res.status(401).json({ message: "Email o contraseña incorrectos" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    });
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}
