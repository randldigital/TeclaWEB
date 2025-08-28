import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { 
  insertPostSchema, insertPlaySchema, updatePlaySchema, insertTicketSchema, 
  insertGalleryItemSchema, insertContactMessageSchema 
} from "@shared/schema";
import { z } from "zod";
import { uploadImage, uploadDocument, uploadAny, getFileUrl, deleteFile } from "./upload";
import { emailService } from "./email";
import { pdfService } from "./pdf";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

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
      // Generate a unique ticket ID
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
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
      
      const validatedData = insertTicketSchema.parse({
        ...req.body,
        userId: req.user!.id,
        qrCode: qrCodeBase64,
      });
      const ticket = await storage.createTicket({
        ...validatedData,
        id: ticketId, // Pass the generated ticket ID separately
      });
      
      // Send email confirmation
      try {
        const user = await storage.getUser(req.user!.id);
        const play = await storage.getPlay(ticket.playId);
        
        if (user && play) {
          await emailService.sendTicketConfirmation({
            ticketId: ticket.id,
            playTitle: play.title,
            userName: user.name,
            userEmail: user.email,
            date: play.dateTime.toLocaleDateString('es-ES'),
            time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            price: play.basePrice,
            seatNumber: ticket.seatNumber || undefined,
            qrCodeUrl: `data:image/png;base64,${ticket.qrCode}`,
          });
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
      
      const fileUrl = getFileUrl(req.file.filename);
      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
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
        date: play.dateTime.toLocaleDateString('es-ES'),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
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
      
      // Validate weekly code first
      const weeklyCode = await storage.getWeeklyCode();
      if (!weeklyCode || providedCode !== weeklyCode.code) {
        return res.status(401).json({ message: "Código semanal inválido" });
      }

      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }

      const user = await storage.getUser(ticket.userId);
      const play = await storage.getPlay(ticket.playId);

      if (!user || !play) {
        return res.status(404).json({ message: "Datos de ticket incompletos" });
      }

      res.json({
        id: ticket.id,
        playTitle: play.title,
        date: play.dateTime.toLocaleDateString('es-ES'),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        price: play.basePrice,
        seatNumber: ticket.seatNumber,
        userName: user.name,
        status: ticket.status || 'Pendiente',
        paidAt: ticket.paidAt
      });
    } catch (error) {
      console.error("Error validating ticket:", error);
      res.status(500).json({ message: "Error interno del servidor" });
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

  // Ticket validation endpoint (for QR code validation) - old version
  app.get("/api/tickets/validate/:id", requireAuth, requireRole(["ADMIN", "MONITOR"]), async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const user = await storage.getUser(ticket.userId);
      const play = await storage.getPlay(ticket.playId);

      if (!user || !play) {
        return res.status(404).json({ message: "User or play not found" });
      }

      res.json({
        id: ticket.id,
        playTitle: play.title,
        userName: user.name,
        date: play.dateTime.toLocaleDateString('es-ES'),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        seatNumber: ticket.seatNumber,
        price: play.basePrice,
        isValid: true
      });
    } catch (error) {
      console.error("Error validating ticket:", error);
      res.status(500).json({ message: "Error validating ticket" });
    }
  });

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
        date: play.dateTime.toLocaleDateString('es-ES'),
        time: play.dateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
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
      const validatedData = insertContactMessageSchema.parse(req.body);
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

  const httpServer = createServer(app);
  return httpServer;
}
