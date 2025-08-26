import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { 
  insertPostSchema, insertPlaySchema, insertTicketSchema, 
  insertGalleryItemSchema, insertContactMessageSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const { limit, status } = req.query;
      const posts = await storage.getPosts(
        limit ? parseInt(limit as string) : undefined,
        status as string
      );
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Error fetching posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  app.post("/api/posts", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Error creating post" });
    }
  });

  app.put("/api/posts/:id", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const validatedData = insertPostSchema.partial().parse(req.body);
      const post = await storage.updatePost(req.params.id, validatedData);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Error updating post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const success = await storage.deletePost(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Error deleting post" });
    }
  });

  // Plays routes
  app.get("/api/plays", async (req, res) => {
    try {
      const { limit } = req.query;
      const plays = await storage.getPlays(limit ? parseInt(limit as string) : undefined);
      res.json(plays);
    } catch (error) {
      console.error("Error fetching plays:", error);
      res.status(500).json({ message: "Error fetching plays" });
    }
  });

  app.get("/api/plays/:id", async (req, res) => {
    try {
      const play = await storage.getPlay(req.params.id);
      if (!play) {
        return res.status(404).json({ message: "Play not found" });
      }
      res.json(play);
    } catch (error) {
      console.error("Error fetching play:", error);
      res.status(500).json({ message: "Error fetching play" });
    }
  });

  app.post("/api/plays", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const validatedData = insertPlaySchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      const play = await storage.createPlay(validatedData);
      res.status(201).json(play);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating play:", error);
      res.status(500).json({ message: "Error creating play" });
    }
  });

  app.put("/api/plays/:id", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const validatedData = insertPlaySchema.partial().parse(req.body);
      const play = await storage.updatePlay(req.params.id, validatedData);
      if (!play) {
        return res.status(404).json({ message: "Play not found" });
      }
      res.json(play);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating play:", error);
      res.status(500).json({ message: "Error updating play" });
    }
  });

  app.delete("/api/plays/:id", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const success = await storage.deletePlay(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Play not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting play:", error);
      res.status(500).json({ message: "Error deleting play" });
    }
  });

  // Tickets routes
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const { playId } = req.query;
      const tickets = await storage.getTickets(
        req.user!.id, 
        playId as string
      );
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Error fetching tickets" });
    }
  });

  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const qrCode = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const validatedData = insertTicketSchema.parse({
        ...req.body,
        userId: req.user!.id,
        qrCode,
      });
      const ticket = await storage.createTicket(validatedData);
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Error creating ticket" });
    }
  });

  // Gallery routes
  app.get("/api/gallery", async (req, res) => {
    try {
      const { visibility } = req.query;
      const items = await storage.getGalleryItems(visibility as string);
      res.json(items);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      res.status(500).json({ message: "Error fetching gallery items" });
    }
  });

  app.post("/api/gallery", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      const item = await storage.createGalleryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating gallery item:", error);
      res.status(500).json({ message: "Error creating gallery item" });
    }
  });

  app.delete("/api/gallery/:id", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const success = await storage.deleteGalleryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Gallery item not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      res.status(500).json({ message: "Error deleting gallery item" });
    }
  });

  // Settings routes
  app.get("/api/settings/:key", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const value = await storage.getSetting(req.params.key);
      if (value === undefined) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json({ key: req.params.key, value });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Error fetching setting" });
    }
  });

  app.put("/api/settings/:key", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { value } = req.body;
      if (typeof value !== 'string') {
        return res.status(400).json({ message: "Value must be a string" });
      }
      await storage.setSetting(req.params.key, value, req.user!.id);
      res.json({ key: req.params.key, value });
    } catch (error) {
      console.error("Error setting value:", error);
      res.status(500).json({ message: "Error setting value" });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating contact message:", error);
      res.status(500).json({ message: "Error creating contact message" });
    }
  });

  app.get("/api/contact", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ message: "Error fetching contact messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
