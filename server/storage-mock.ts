import session from "express-session";
import { nanoid } from "nanoid";
import { 
  type User, type InsertUser, type Post, type InsertPost,
  type Play, type InsertPlay, type Ticket, type InsertTicket,
  type GalleryItem, type InsertGalleryItem, type ContactMessage, type InsertContactMessage
} from "@shared/schema";

// Simple memory store for sessions
class SimpleMemoryStore extends session.Store {
  private sessions: Map<string, any> = new Map();

  get(sid: string, callback: (err: any, session?: any) => void): void {
    const session = this.sessions.get(sid);
    callback(null, session);
  }

  set(sid: string, session: any, callback?: (err?: any) => void): void {
    this.sessions.set(sid, session);
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    this.sessions.delete(sid);
    if (callback) callback();
  }

  touch(sid: string, session: any, callback?: (err?: any) => void): void {
    this.sessions.set(sid, session);
    if (callback) callback();
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Posts
  getPosts(limit?: number, status?: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  
  // Plays
  getPlays(limit?: number): Promise<Play[]>;
  getPlay(id: string): Promise<Play | undefined>;
  createPlay(play: InsertPlay): Promise<Play>;
  updatePlay(id: string, updates: Partial<InsertPlay>): Promise<Play | undefined>;
  deletePlay(id: string): Promise<boolean>;
  
  // Tickets
  getTickets(userId?: string, playId?: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  deleteTicket(id: string): Promise<boolean>;
  
  // Gallery
  getGalleryItems(visibility?: string): Promise<GalleryItem[]>;
  getGalleryItem(id: string): Promise<GalleryItem | undefined>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, updates: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: string): Promise<boolean>;
  
  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string, updatedBy: string): Promise<void>;
  
  // Contact
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  // Validation system
  getWeeklyCode(): Promise<{ code: string; validFrom: string; validTo: string } | undefined>;
  updateTicketStatus(id: string, status: 'Pendiente' | 'Pagado'): Promise<Ticket | undefined>;
  createValidationLog(log: { ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }): Promise<void>;
  
  sessionStore: session.Store;
}

export class MockStorage implements IStorage {
  sessionStore: session.Store;
  private users: User[] = [];
  private posts: Post[] = [];
  private plays: Play[] = [];
  private tickets: Ticket[] = [];
  private galleryItems: GalleryItem[] = [];
  private settings: { key: string; value: string; updatedBy: string; updatedAt: Date }[] = [];
  private contactMessages: ContactMessage[] = [];
  private weeklyCode: { code: string; validFrom: string; validTo: string } | undefined;
  private validationLogs: { id: string; ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }[] = [];

  constructor() {
    this.sessionStore = new SimpleMemoryStore();
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create a default admin user
    const adminUser: User = {
      id: nanoid(),
      email: "admin@claretsevilla.com",
      password: "hashed_password",
      googleId: null,
      name: "Administrador",
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(adminUser);

    // Create some sample posts
    const samplePost: Post = {
      id: nanoid(),
      title: "Bienvenidos al Teatro Claret",
      content: "Bienvenidos a nuestro teatro escolar. Aquí encontrarán información sobre nuestras próximas obras y eventos.",
      excerpt: "Bienvenidos a nuestro teatro escolar...",
      imageUrl: null,
      status: "PUBLISHED",
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.push(samplePost);

    // Create some sample plays
    const samplePlay: Play = {
      id: nanoid(),
      title: "Romeo y Julieta",
      description: "Una adaptación moderna de la clásica obra de Shakespeare.",
      posterUrl: null,
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      basePrice: 5.0,
      genre: "Drama",
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plays.push(samplePlay);

    // Create some sample gallery items
    const sampleGalleryItem: GalleryItem = {
      id: nanoid(),
      title: "Ensayo General",
      description: "Imágenes del ensayo general de nuestra última obra.",
      imageUrl: "https://via.placeholder.com/400x300",
      type: "IMAGE",
      visibility: "PUBLIC",
      createdBy: adminUser.id,
      createdAt: new Date(),
    };
    this.galleryItems.push(sampleGalleryItem);

    // Create a test ticket for validation testing
    const testUser: User = {
      id: nanoid(),
      email: "test@example.com",
      password: "hashed_password",
      googleId: null,
      name: "Usuario de Prueba",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(testUser);

    // Create multiple test tickets for validation testing
    const testTickets: Ticket[] = [
      {
        id: "TICKET-1756214993403-nl265v1u6",
        userId: testUser.id,
        playId: samplePlay.id,
        qrCode: "test-qr-code-base64",
        seatNumber: "A1",
        status: "Pendiente",
        paidAt: null,
        createdAt: new Date(),
      },
      {
        id: "TICKET-1756215517380-zozlc79fx", // The QR code you scanned
        userId: testUser.id,
        playId: samplePlay.id,
        qrCode: "test-qr-code-base64-2",
        seatNumber: "B2",
        status: "Pagado",
        paidAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: "TICKET-1756214993404-abc123def",
        userId: testUser.id,
        playId: samplePlay.id,
        qrCode: "test-qr-code-base64-3",
        seatNumber: "C3",
        status: "Pendiente",
        paidAt: null,
        createdAt: new Date(),
      },
      {
        id: "TICKET-1756287933457-jy598algs", // Recently downloaded ticket
        userId: testUser.id,
        playId: samplePlay.id,
        qrCode: "test-qr-code-base64-4",
        seatNumber: "D4",
        status: "Pendiente",
        paidAt: null,
        createdAt: new Date(),
      }
    ];
    
    this.tickets.push(...testTickets);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: nanoid(),
      email: insertUser.email,
      password: insertUser.password || null,
      googleId: insertUser.googleId || null,
      name: insertUser.name,
      role: insertUser.role || "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...updates, updatedAt: new Date() };
    return this.users[index];
  }

  // Posts
  async getPosts(limit: number = 50, status?: string): Promise<Post[]> {
    let filtered = this.posts;
    if (status) {
      filtered = filtered.filter(post => post.status === status);
    }
    return filtered.slice(0, limit);
  }

  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.find(post => post.id === id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const post: Post = {
      id: nanoid(),
      title: insertPost.title,
      content: insertPost.content,
      excerpt: insertPost.excerpt || null,
      imageUrl: insertPost.imageUrl || null,
      status: insertPost.status || "PUBLISHED",
      createdBy: insertPost.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.push(post);
    return post;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const index = this.posts.findIndex(post => post.id === id);
    if (index === -1) return undefined;
    
    this.posts[index] = { ...this.posts[index], ...updates, updatedAt: new Date() };
    return this.posts[index];
  }

  async deletePost(id: string): Promise<boolean> {
    const index = this.posts.findIndex(post => post.id === id);
    if (index === -1) return false;
    
    this.posts.splice(index, 1);
    return true;
  }

  // Plays
  async getPlays(limit: number = 50): Promise<Play[]> {
    return this.plays.slice(0, limit);
  }

  async getPlay(id: string): Promise<Play | undefined> {
    return this.plays.find(play => play.id === id);
  }

  async createPlay(insertPlay: InsertPlay): Promise<Play> {
    const play: Play = {
      id: nanoid(),
      title: insertPlay.title,
      description: insertPlay.description,
      posterUrl: insertPlay.posterUrl || null,
      dateTime: insertPlay.dateTime,
      basePrice: insertPlay.basePrice || 5.0,
      genre: insertPlay.genre || null,
      createdBy: insertPlay.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plays.push(play);
    return play;
  }

  async updatePlay(id: string, updates: Partial<InsertPlay>): Promise<Play | undefined> {
    const index = this.plays.findIndex(play => play.id === id);
    if (index === -1) return undefined;
    
    this.plays[index] = { ...this.plays[index], ...updates, updatedAt: new Date() };
    return this.plays[index];
  }

  async deletePlay(id: string): Promise<boolean> {
    const index = this.plays.findIndex(play => play.id === id);
    if (index === -1) return false;
    
    this.plays.splice(index, 1);
    return true;
  }

  // Tickets
  async getTickets(userId?: string, playId?: string): Promise<Ticket[]> {
    let filtered = this.tickets;
    if (userId && playId) {
      filtered = filtered.filter(ticket => ticket.userId === userId && ticket.playId === playId);
    } else if (userId) {
      filtered = filtered.filter(ticket => ticket.userId === userId);
    } else if (playId) {
      filtered = filtered.filter(ticket => ticket.playId === playId);
    }
    return filtered;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.find(ticket => ticket.id === id);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const ticket: Ticket = {
      id: nanoid(),
      userId: insertTicket.userId,
      playId: insertTicket.playId,
      qrCode: insertTicket.qrCode,
      seatNumber: insertTicket.seatNumber || null,
      status: insertTicket.status || "Pendiente",
      paidAt: null,
      createdAt: new Date(),
    };
    this.tickets.push(ticket);
    return ticket;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const index = this.tickets.findIndex(ticket => ticket.id === id);
    if (index === -1) return false;
    
    this.tickets.splice(index, 1);
    return true;
  }

  // Gallery
  async getGalleryItems(visibility?: string): Promise<GalleryItem[]> {
    let filtered = this.galleryItems;
    if (visibility) {
      filtered = filtered.filter(item => item.visibility === visibility);
    }
    return filtered;
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    return this.galleryItems.find(item => item.id === id);
  }

  async createGalleryItem(insertItem: InsertGalleryItem): Promise<GalleryItem> {
    const item: GalleryItem = {
      id: nanoid(),
      title: insertItem.title,
      description: insertItem.description || null,
      imageUrl: insertItem.imageUrl,
      type: insertItem.type || "IMAGE",
      visibility: insertItem.visibility || "PUBLIC",
      createdBy: insertItem.createdBy,
      createdAt: new Date(),
    };
    this.galleryItems.push(item);
    return item;
  }

  async updateGalleryItem(id: string, updates: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const index = this.galleryItems.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    
    this.galleryItems[index] = { ...this.galleryItems[index], ...updates };
    return this.galleryItems[index];
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const index = this.galleryItems.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.galleryItems.splice(index, 1);
    return true;
  }

  // Settings
  async getSetting(key: string): Promise<string | undefined> {
    const setting = this.settings.find(s => s.key === key);
    return setting?.value;
  }

  async setSetting(key: string, value: string, updatedBy: string): Promise<void> {
    const index = this.settings.findIndex(s => s.key === key);
    if (index === -1) {
      this.settings.push({ key, value, updatedBy, updatedAt: new Date() });
    } else {
      this.settings[index] = { key, value, updatedBy, updatedAt: new Date() };
    }
  }

  // Contact
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const message: ContactMessage = {
      id: nanoid(),
      name: insertMessage.name,
      email: insertMessage.email,
      subject: insertMessage.subject,
      message: insertMessage.message,
      status: insertMessage.status || "UNREAD",
      createdAt: new Date(),
    };
    this.contactMessages.push(message);
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return this.contactMessages;
  }

  // Validation system
  async getWeeklyCode(): Promise<{ code: string; validFrom: string; validTo: string } | undefined> {
    // Initialize with a default weekly code if none exists
    if (!this.weeklyCode) {
      const now = new Date();
      const validFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const validTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      this.weeklyCode = {
        code: '12345',
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString()
      };
    }
    return this.weeklyCode;
  }

  async updateTicketStatus(id: string, status: 'Pendiente' | 'Pagado'): Promise<Ticket | undefined> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return undefined;
    
    ticket.status = status;
    if (status === 'Pagado') {
      (ticket as any).paidAt = new Date().toISOString();
    }
    
    return ticket;
  }

  async createValidationLog(log: { ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }): Promise<void> {
    const validationLog = {
      id: nanoid(),
      ...log
    };
    this.validationLogs.push(validationLog);
  }
}

export const storage = new MockStorage(); 