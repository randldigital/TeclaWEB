import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { 
  insertPostSchema, insertPlaySchema, updatePlaySchema, insertTicketSchema, 
  insertGalleryItemSchema, insertContactMessageSchema, insertPlayCommentSchema, insertPlayMemoryPhotoSchema
} from "@shared/schema";
import { z } from "zod";
import { uploadImage, uploadDocument, uploadAny, getFileUrl, deleteFile, validateFileContent, detectImageOrientationFromFile } from "./upload";
import { emailService } from "./email";
import { pdfService } from "./pdf";
import { sanitizeObject } from "./sanitize";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));
  
  // Serve attached assets
  app.use('/attached_assets', express.static('attached_assets'));

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
      // Sanitize input data to prevent XSS
      const sanitizedData = sanitizeObject(req.body, ['content'], ['title', 'excerpt']);
      
      const validatedData = insertPostSchema.parse({
        ...sanitizedData,
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
      // Sanitize input data to prevent XSS
      const sanitizedData = sanitizeObject(req.body, ['content'], ['title', 'excerpt']);
      
      const validatedData = insertPostSchema.partial().parse(sanitizedData);
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
      const validatedData = updatePlaySchema.parse(req.body);
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

  // Showtimes routes (grouped plays)
  app.get("/api/plays-grouped", async (req, res) => {
    try {
      const groupedPlays = await storage.getPlaysGrouped();
      res.json(groupedPlays);
    } catch (error) {
      console.error("Error fetching grouped plays:", error);
      res.status(500).json({ message: "Error fetching grouped plays" });
    }
  });

  app.get("/api/plays/:id/showtimes", async (req, res) => {
    try {
      const showtimes = await storage.getShowtimesForPlay(req.params.id);
      res.json(showtimes);
    } catch (error) {
      console.error("Error fetching showtimes:", error);
      res.status(500).json({ message: "Error fetching showtimes" });
    }
  });

  app.get("/api/plays/:id/comments", async (req, res) => {
    try {
      const includePending = req.isAuthenticated() && req.user?.role === "ADMIN";
      const comments = await storage.getPlayComments(req.params.id, includePending);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching play comments:", error);
      res.status(500).json({ message: "Error fetching play comments" });
    }
  });

  app.post("/api/plays/:id/comments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPlayCommentSchema.pick({ content: true }).parse(req.body);
      const comment = await storage.createPlayComment({
        playId: req.params.id,
        userId: req.user!.id,
        content: validatedData.content,
        status: "pending",
      });
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating play comment:", error);
      res.status(500).json({ message: "Error creating play comment" });
    }
  });

  app.post("/api/plays/:id/comments/:commentId/approve", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const comment = await storage.approvePlayComment(req.params.commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      res.json(comment);
    } catch (error) {
      console.error("Error approving play comment:", error);
      res.status(500).json({ message: "Error approving play comment" });
    }
  });

  app.post("/api/plays/:id/comments/:commentId/reject", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.rejectPlayComment(req.params.commentId);
      if (!deleted) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Error rejecting play comment:", error);
      res.status(500).json({ message: "Error rejecting play comment" });
    }
  });

  app.get("/api/plays/:id/memory-photos", async (req, res) => {
    try {
      const photos = await storage.getPlayMemoryPhotos(req.params.id);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching play memory photos:", error);
      res.status(500).json({ message: "Error fetching play memory photos" });
    }
  });

  app.post("/api/plays/:id/memory-photos", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const validatedData = insertPlayMemoryPhotoSchema.pick({ imageUrl: true }).parse(req.body);
      const photo = await storage.createPlayMemoryPhoto({
        playId: req.params.id,
        imageUrl: validatedData.imageUrl,
        createdBy: req.user!.id,
      });
      res.status(201).json(photo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("hasta 3 fotos")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error creating play memory photo:", error);
      res.status(500).json({ message: "Error creating play memory photo" });
    }
  });

  app.patch("/api/plays/:id/memory-photos/order", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const payload = z.object({ photoIds: z.array(z.string()).max(3) }).parse(req.body);
      const orderedPhotos = await storage.reorderPlayMemoryPhotos(req.params.id, payload.photoIds);
      res.json(orderedPhotos);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error reordering play memory photos:", error);
      res.status(500).json({ message: "Error reordering play memory photos" });
    }
  });

  app.delete("/api/plays/:id/memory-photos/:photoId", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const deleted = await storage.deletePlayMemoryPhoto(req.params.photoId);
      if (!deleted) {
        return res.status(404).json({ message: "Foto no encontrada" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting play memory photo:", error);
      res.status(500).json({ message: "Error deleting play memory photo" });
    }
  });

  // Play Statistics endpoint
  app.get("/api/plays/:id/statistics", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const statistics = await storage.getPlayStatistics(req.params.id);
      if (!statistics) {
        return res.status(404).json({ message: "Play not found" });
      }
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching play statistics:", error);
      res.status(500).json({ message: "Error fetching play statistics" });
    }
  });

  // User Management endpoints (ADMIN only)
  app.get("/api/admin/users", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { role, search, limit } = req.query;
      
      let users;
      if (role && role !== 'all') {
        users = await storage.getUsersByRole(role as string);
      } else {
        users = await storage.getAllUsers();
      }

      // Apply search filter if provided
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        );
      }

      // Apply limit if provided
      if (limit) {
        users = users.slice(0, parseInt(limit as string));
      }

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/admin/users/emails", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { format = 'json', role } = req.query;
      const emailList = await storage.getUserEmailList();
      
      let filteredEmails = emailList;
      if (role && role !== 'all') {
        filteredEmails = emailList.filter(user => user.role === role);
      }

      if (format === 'csv') {
        const csvContent = [
          'Name,Email,Role,Registration Date',
          ...filteredEmails.map(user => 
            `"${user.name}","${user.email}","${user.role}","${user.createdAt}"`
          )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="user-emails.csv"');
        res.send(csvContent);
      } else if (format === 'text') {
        const textContent = filteredEmails.map(user => user.email).join('\n');
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="user-emails.txt"');
        res.send(textContent);
      } else {
        res.json(filteredEmails);
      }
    } catch (error) {
      console.error("Error fetching user emails:", error);
      res.status(500).json({ message: "Error fetching user emails" });
    }
  });

  app.get("/api/admin/users/stats", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const statistics = await storage.getUserStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ message: "Error fetching user statistics" });
    }
  });

  // Update user role endpoint
  app.put("/api/admin/users/:id/role", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;
      
      // Validate role
      const validRoles = ["ADMIN", "MONITOR", "USER"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Rol inválido" });
      }
      
      // Update user role
      const updatedUser = await storage.updateUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role" });
    }
  });

  app.post("/api/plays/:id/showtimes", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const validatedData = insertPlaySchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      const showtime = await storage.createShowtime(validatedData, req.params.id);
      res.status(201).json(showtime);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating showtime:", error);
      res.status(500).json({ message: "Error creating showtime" });
    }
  });

  // Tickets routes
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const { playId, userId } = req.query;
      
      // If userId is provided, check if user is admin/monitor or the ticket owner
      let targetUserId = req.user!.id;
      if (userId && userId !== req.user!.id) {
        // Only allow admins/monitors to view other users' tickets
        if (!['ADMIN', 'MONITOR'].includes(req.user!.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
        targetUserId = userId as string;
      }
      
      const tickets = await storage.getTickets(
        targetUserId, 
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
      const { playId, quantity = 1, adultTickets = 1, childTickets = 0 } = req.body;
      
      // Validate quantities for group bookings
      if (quantity < 1 || quantity > 6) {
        return res.status(400).json({ message: "Cantidad debe estar entre 1 y 6" });
      }
      
      if (adultTickets + childTickets !== quantity) {
        return res.status(400).json({ message: "La suma de adultos y niños debe igualar la cantidad total" });
      }
      
      // Generate a unique ticket ID (use GROUP prefix for group tickets)
      const ticketId = quantity > 1 
        ? `GROUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        : `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate QR code as base64 image
      const QRCode = await import('qrcode');
      const qrCodeBuffer = await QRCode.toBuffer(ticketId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        type: 'png'
      });
      
      // Convert buffer to base64 string
      const qrCodeBase64 = qrCodeBuffer.toString('base64');
      
      // Calculate total price for group bookings
      const play = await storage.getPlay(playId);
      if (!play) {
        return res.status(404).json({ message: "Play not found" });
      }
      
      // Check if booking is closed (1 hour before showtime)
      const showtimeDate = new Date(play.dateTime);
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
      
      if (showtimeDate <= oneHourFromNow) {
        return res.status(400).json({ 
          message: "Las reservas están cerradas. Las reservas se cierran 1 hora antes del inicio del showtime." 
        });
      }
      
      // Calculate total price - Monitor users get free tickets (VIP booking)
      let totalPrice = storage.calculateGroupPrice(play.basePrice, adultTickets, childTickets);
      
      // If user is Monitor, set price to 0 (free booking)
      if (req.user!.role === "MONITOR") {
        totalPrice = 0;
      }
      
      const validatedData = insertTicketSchema.parse({
        playId,
        userId: req.user!.id,
        qrCode: qrCodeBase64,
      });
      
      const ticket = await storage.createTicket({
        ...validatedData,
        id: ticketId,
        quantity,
        adultTickets,
        childTickets,
        totalPrice,
      });
      
      // Send email confirmation
      try {
        const user = await storage.getUser(req.user!.id);
        
        if (user && play) {
          if (quantity > 1) {
            // Send group ticket confirmation
            await emailService.sendGroupTicketConfirmation({
              ticketId: ticket.id,
              playTitle: play.title,
              userName: user.name,
              userEmail: user.email,
              date: play.dateTime.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
              time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
              adultTickets,
              childTickets,
              totalPrice,
              qrCodeUrl: `data:image/png;base64,${ticket.qrCode}`,
            });
          } else {
            // Send single ticket confirmation (existing functionality)
            await emailService.sendTicketConfirmation({
              ticketId: ticket.id,
              playTitle: play.title,
              userName: user.name,
              userEmail: user.email,
              date: play.dateTime.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
              time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
              price: play.basePrice,
              seatNumber: ticket.seatNumber || undefined,
              qrCodeUrl: `data:image/png;base64,${ticket.qrCode}`,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send ticket confirmation email:', emailError);
        // Don't fail the ticket creation if email fails
      }
      
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

  // Test QR code generation endpoint
  app.get("/api/test/qr/:ticketId", async (req, res) => {
    try {
      const ticketId = req.params.ticketId;
      
      // Get the ticket from database
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Generate QR code as base64 image
      const QRCode = await import('qrcode');
      const qrCodeBuffer = await QRCode.toBuffer(ticketId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        type: 'png'
      });
      
      // Convert buffer to base64 string
      const qrCodeBase64 = qrCodeBuffer.toString('base64');
      
      res.json({
        ticketId,
        storedQrCode: ticket.qrCode ? ticket.qrCode.substring(0, 50) + '...' : 'No QR code stored',
        generatedQrCode: qrCodeBase64.substring(0, 50) + '...',
        qrCodeUrl: `data:image/png;base64,${qrCodeBase64}`
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Error generating QR code" });
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

  // File upload routes
  app.post("/api/upload/image", requireAuth, requireRole(["ADMIN", "MONITOR"]), uploadImage.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Validate file content to prevent malicious uploads
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const filePath = req.file.path;
      const isValidContent = await validateFileContent(filePath, allowedImageTypes);
      
      if (!isValidContent) {
        // Delete the uploaded file if it's not valid
        deleteFile(req.file.filename);
        return res.status(400).json({ message: "Invalid file type detected" });
      }
      
      // Detect image orientation
      const imageMetadata = await detectImageOrientationFromFile(filePath);
      
      const fileUrl = getFileUrl(req.file.filename);
      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        orientation: imageMetadata?.orientation || 'square',
        width: imageMetadata?.width || 0,
        height: imageMetadata?.height || 0,
        aspectRatio: imageMetadata?.aspectRatio || 1
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Error uploading image" });
    }
  });

  app.post("/api/upload/document", requireAuth, requireRole(["ADMIN", "MONITOR"]), uploadDocument.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = getFileUrl(req.file.filename);
      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Error uploading document" });
    }
  });

  app.post("/api/upload/any", requireAuth, requireRole(["ADMIN", "MONITOR"]), uploadAny.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = getFileUrl(req.file.filename);
      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Error uploading file" });
    }
  });

  app.delete("/api/upload/:filename", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const { filename } = req.params;
      const success = deleteFile(filename);
      
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Error deleting file" });
    }
  });

  // PDF Generation routes
  app.get("/api/tickets/:id/pdf", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user owns the ticket or is admin/monitor
      if (ticket.userId !== req.user!.id && !['ADMIN', 'MONITOR'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getUser(ticket.userId);
      const play = await storage.getPlay(ticket.playId);

      if (!user || !play) {
        return res.status(404).json({ message: "User or play not found" });
      }

      const pdf = await pdfService.generateTicketPDF({
        ticketId: ticket.id,
        playTitle: play.title,
        userName: user.name,
        date: play.dateTime.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
        price: play.basePrice,
        seatNumber: ticket.seatNumber || undefined,
        qrCodeData: `data:image/png;base64,${ticket.qrCode}`,
      });

      if (!pdf || pdf.length === 0) {
        return res.status(500).json({ message: "Generated PDF is empty" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.id}.pdf"`);
      res.setHeader('Content-Length', pdf.length.toString());
      res.send(pdf);
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Error generating PDF: ${errorMessage}` });
    }
  });

  // Weekly code validation endpoint
  app.post("/api/validation/weekly-code", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || code.length !== 5) {
        return res.status(400).json({ message: "Código inválido" });
      }

      // Get current weekly code from database
      const weeklyCode = await storage.getWeeklyCode();
      
      if (!weeklyCode) {
        return res.status(404).json({ message: "No hay código semanal configurado" });
      }

      const now = new Date();
      const validFrom = new Date(weeklyCode.validFrom);
      const validTo = new Date(weeklyCode.validTo);

      if (code !== weeklyCode.code) {
        return res.status(401).json({ message: "Código incorrecto" });
      }

      if (now < validFrom || now > validTo) {
        return res.status(401).json({ message: "Código caducado" });
      }

      res.json({ message: "Código válido", validFrom, validTo });
    } catch (error) {
      console.error("Error validating weekly code:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Ticket validation endpoint (for QR code validation)
  app.post("/api/validation/ticket/:id", async (req, res) => {
    try {
      const { weeklyCode: providedCode } = req.body;
      
      if (!providedCode) {
        return res.status(400).json({ 
          message: "Código semanal requerido",
          error: "MISSING_WEEKLY_CODE"
        });
      }
      
      // Validate weekly code first
      const weeklyCode = await storage.getWeeklyCode();
      if (!weeklyCode || providedCode !== weeklyCode.code) {
        return res.status(401).json({ 
          message: "Código semanal inválido",
          error: "INVALID_WEEKLY_CODE"
        });
      }

      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ 
          message: "Ticket no encontrado",
          error: "TICKET_NOT_FOUND"
        });
      }

      const user = await storage.getUser(ticket.userId);
      const play = await storage.getPlay(ticket.playId);

      if (!user || !play) {
        return res.status(404).json({ 
          message: "Datos de ticket incompletos",
          error: "INCOMPLETE_DATA"
        });
      }

      // Check if it's a group ticket
      const isGroupTicket = ticket.quantity > 1;
      
      const responseData = {
        id: ticket.id,
        playTitle: play.title,
        date: play.dateTime.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
        userName: user.name,
        status: ticket.status || 'Pendiente',
        paidAt: ticket.paidAt,
        qrCode: ticket.qrCode,
        isGroupTicket,
        quantity: ticket.quantity,
        adultTickets: ticket.adultTickets,
        childTickets: ticket.childTickets,
        totalPrice: ticket.totalPrice,
        basePrice: play.basePrice,
        seatNumber: ticket.seatNumber,
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error validating ticket:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // Test QR code generation endpoint
  app.get("/api/test/qr/:ticketId", async (req, res) => {
    try {
      const ticketId = req.params.ticketId;
      
      // Get the ticket from database
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Generate QR code as base64 image
      const QRCode = await import('qrcode');
      const qrCodeBuffer = await QRCode.toBuffer(ticketId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        type: 'png'
      });
      
      // Convert buffer to base64 string
      const qrCodeBase64 = qrCodeBuffer.toString('base64');
      
      res.json({
        ticketId,
        storedQrCode: ticket.qrCode ? ticket.qrCode.substring(0, 50) + '...' : 'No QR code stored',
        generatedQrCode: qrCodeBase64.substring(0, 50) + '...',
        qrCodeUrl: `data:image/png;base64,${qrCodeBase64}`
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Error generating QR code" });
    }
  });

  // Debug ticket endpoint
  app.get("/api/debug/ticket/:id", async (req, res) => {
    try {
      const ticketId = req.params.id;
      
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const user = await storage.getUser(ticket.userId);
      const play = await storage.getPlay(ticket.playId);
      
      res.json({
        ticket,
        user: user || null,
        play: play || null,
        userExists: !!user,
        playExists: !!play
      });
    } catch (error) {
      console.error("Error debugging ticket:", error);
      res.status(500).json({ message: "Error debugging ticket" });
    }
  });

  // Confirm payment endpoint
  app.post("/api/validation/confirm-payment/:id", async (req, res) => {
    try {
      const { weeklyCode: providedCode } = req.body;
      
      // Validate weekly code first
      const weeklyCode = await storage.getWeeklyCode();
      if (!weeklyCode || providedCode !== weeklyCode.code) {
        return res.status(401).json({ message: "Código semanal inválido" });
      }

      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }

      if (ticket.status === 'Pagado') {
        return res.status(400).json({ message: "Esta entrada ya fue validada" });
      }

      // Update ticket status to paid
      const updatedTicket = await storage.updateTicketStatus(ticket.id, 'Pagado');
      
      // Log the validation (optional - don't fail if this fails)
      try {
        await storage.createValidationLog({
          ticketId: ticket.id,
          validatedAt: new Date().toISOString(),
          validatedBy: 'Weekly Code System',
          weeklyCode: providedCode
        });
      } catch (logError) {
        console.warn('Failed to create validation log, but payment was confirmed:', logError);
        // Continue with the response even if logging fails
      }

      res.json({ 
        message: "Pago confirmado exitosamente",
        ticket: updatedTicket
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Ticket validation endpoint removed - use /api/validation/ticket/:id instead

  app.post("/api/tickets/:id/pdf", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user owns the ticket or is admin/monitor
      if (ticket.userId !== req.user!.id && !['ADMIN', 'MONITOR'].includes(req.user!.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getUser(ticket.userId);
      const play = await storage.getPlay(ticket.playId);

      if (!user || !play) {
        return res.status(404).json({ message: "User or play not found" });
      }

      // Generate custom HTML
      const html = await pdfService.generateCustomTicketHTML({
        ticketId: ticket.id,
        playTitle: play.title,
        userName: user.name,
        date: play.dateTime.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
        price: play.basePrice,
        seatNumber: ticket.seatNumber || undefined,
        qrCodeData: `data:image/png;base64,${ticket.qrCode}`,
      });

      const pdf = await pdfService.generateTicketPDFFromHTML(html);

      if (!pdf || pdf.length === 0) {
        return res.status(500).json({ message: "Generated PDF is empty" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.id}.pdf"`);
      res.setHeader('Content-Length', pdf.length.toString());
      res.send(pdf);
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Error generating PDF: ${errorMessage}` });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      // Sanitize input data to prevent XSS
      const sanitizedData = sanitizeObject(req.body, ['message'], ['name', 'email', 'subject']);
      
      const validatedData = insertContactMessageSchema.parse(sanitizedData);
      const message = await storage.createContactMessage(validatedData);
      
      // Send email notification to admin
      try {
        await emailService.sendContactNotification(validatedData);
      } catch (emailError) {
        console.error('Failed to send contact notification email:', emailError);
        // Don't fail the contact form submission if email fails
      }
      
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

  // Admin API endpoints
  // Weekly code management
  app.get("/api/admin/weekly-code", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const weeklyCode = await storage.getWeeklyCode();
      res.json(weeklyCode || { code: '', validFrom: '', validTo: '' });
    } catch (error) {
      console.error("Error fetching weekly code:", error);
      res.status(500).json({ message: "Error fetching weekly code" });
    }
  });

  app.post("/api/admin/weekly-code", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const { code, validFrom, validTo } = req.body;
      
      if (!code || code.length !== 5) {
        return res.status(400).json({ message: "Código debe tener 5 dígitos" });
      }

      if (!validFrom || !validTo) {
        return res.status(400).json({ message: "Fechas de validez requeridas" });
      }

      await storage.setSetting('weekly_code', code, req.user!.id);
      await storage.setSetting('weekly_code_valid_from', validFrom, req.user!.id);
      await storage.setSetting('weekly_code_valid_to', validTo, req.user!.id);

      res.json({ message: "Código semanal actualizado" });
    } catch (error) {
      console.error("Error updating weekly code:", error);
      res.status(500).json({ message: "Error updating weekly code" });
    }
  });

  // Validation logs
  app.get("/api/admin/validation-logs", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const logs = await storage.getValidationLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching validation logs:", error);
      res.status(500).json({ message: "Error fetching validation logs" });
    }
  });

  // Validation statistics
  app.get("/api/admin/validation-stats", requireAuth, requireRole(["ADMIN"]), async (req, res) => {
    try {
      const stats = await storage.getValidationStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching validation stats:", error);
      res.status(500).json({ message: "Error fetching validation stats" });
    }
  });

  // User profile routes
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, email } = req.body;
      
      // Validate input
      if (!name || !email) {
        return res.status(400).json({ message: "Nombre y email son requeridos" });
      }
      
      if (name.length < 2) {
        return res.status(400).json({ message: "El nombre debe tener al menos 2 caracteres" });
      }
      
      // Check if email is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }
      
      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).json({ message: "Este email ya está en uso" });
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(req.user!.id, {
        name,
        email,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Error al actualizar el perfil" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
