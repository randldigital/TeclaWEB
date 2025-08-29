import session from "express-session";
import { nanoid } from "nanoid";
import Database from 'better-sqlite3';

// Create a direct SQLite connection
const sqlite = new Database('teclaweb.db');
import { 
  type User, type InsertUser, type Post, type InsertPost,
  type Play, type InsertPlay, type Ticket, type InsertTicket,
  type GalleryItem, type InsertGalleryItem, type ContactMessage, type InsertContactMessage
} from "@shared/schema";

// Memory-based session store for simplicity
class MemorySessionStore extends session.Store {
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
  updateTicketStatus(id: string, status: 'Pendiente' | 'Pagado'): Promise<Ticket | undefined>;
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
  createValidationLog(log: { ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }): Promise<void>;
  getValidationLogs(): Promise<{ id: string; ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }[]>;
  getValidationStats(): Promise<{
    totalValidations: number;
    todayValidations: number;
    weeklyValidations: number;
    monthlyValidations: number;
    activeWeeklyCode: string;
    lastValidation: string;
    validationRate: number;
  }>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemorySessionStore();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!result) return undefined;
    
    return {
      id: result.id,
      email: result.email,
      password: result.password,
      googleId: result.google_id,
      name: result.name,
      role: result.role,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = sqlite.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!result) return undefined;
    
    return {
      id: result.id,
      email: result.email,
      password: result.password,
      googleId: result.google_id,
      name: result.name,
      role: result.role,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
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
    
    sqlite.prepare(`
      INSERT INTO users (id, email, password, google_id, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, user.email, user.password, user.googleId, user.name, user.role, user.createdAt.toISOString(), user.updatedAt.toISOString());
    
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...updates };
    const setClause = Object.keys(updateData).map(key => {
      // Convert camelCase to snake_case for database columns
      const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${dbColumn} = ?`;
    }).join(', ');
    const values = Object.values(updateData);
    
    // Add updated_at timestamp
    const finalSetClause = setClause ? `${setClause}, updated_at = ?` : 'updated_at = ?';
    const finalValues = setClause ? [...values, new Date().toISOString()] : [new Date().toISOString()];
    
    sqlite.prepare(`UPDATE users SET ${finalSetClause} WHERE id = ?`).run(...finalValues, id);
    return this.getUser(id);
  }

  // Post methods
  async getPosts(limit: number = 50, status?: string): Promise<Post[]> {
    let query = 'SELECT * FROM posts';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    return sqlite.prepare(query).all(...params) as Post[];
  }

  async getPost(id: string): Promise<Post | undefined> {
    const result = sqlite.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    return result as Post | undefined;
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
    
    sqlite.prepare(`
      INSERT INTO posts (id, title, content, excerpt, image_url, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(post.id, post.title, post.content, post.excerpt, post.imageUrl, post.status, post.createdBy, post.createdAt.toISOString(), post.updatedAt.toISOString());
    
    return post;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const updateData = { ...updates };
    const setClause = Object.keys(updateData).map(key => {
      // Convert camelCase to snake_case for database columns
      const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${dbColumn} = ?`;
    }).join(', ');
    const values = Object.values(updateData);
    
    // Add updated_at timestamp
    const finalSetClause = setClause ? `${setClause}, updated_at = ?` : 'updated_at = ?';
    const finalValues = setClause ? [...values, new Date().toISOString()] : [new Date().toISOString()];
    
    sqlite.prepare(`UPDATE posts SET ${finalSetClause} WHERE id = ?`).run(...finalValues, id);
    return this.getPost(id);
  }

  async deletePost(id: string): Promise<boolean> {
    const result = sqlite.prepare('DELETE FROM posts WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Play methods
  async getPlays(limit: number = 50): Promise<Play[]> {
    const results = sqlite.prepare('SELECT * FROM plays ORDER BY date_time DESC LIMIT ?').all(limit) as any[];
    return results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      posterUrl: result.poster_url,
      dateTime: new Date(result.date_time),
      basePrice: result.base_price,
      genre: result.genre,
      createdBy: result.created_by,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    }));
  }

  async getPlay(id: string): Promise<Play | undefined> {
    const result = sqlite.prepare('SELECT * FROM plays WHERE id = ?').get(id) as any;
    if (!result) return undefined;
    
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      posterUrl: result.poster_url,
      dateTime: new Date(result.date_time),
      basePrice: result.base_price,
      genre: result.genre,
      createdBy: result.created_by,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
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
    
    sqlite.prepare(`
      INSERT INTO plays (id, title, description, poster_url, date_time, base_price, genre, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(play.id, play.title, play.description, play.posterUrl, play.dateTime.toISOString(), play.basePrice, play.genre, play.createdBy, play.createdAt.toISOString(), play.updatedAt.toISOString());
    
    return play;
  }

  async updatePlay(id: string, updates: Partial<InsertPlay>): Promise<Play | undefined> {
    const updateData = { ...updates };
    
    // Convert Date objects to ISO strings for SQLite
    const processedData: any = {};
    Object.entries(updateData).forEach(([key, value]) => {
      if (value instanceof Date) {
        processedData[key] = value.toISOString();
      } else {
        processedData[key] = value;
      }
    });
    
    const setClause = Object.keys(processedData).map(key => {
      // Convert camelCase to snake_case for database columns
      const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${dbColumn} = ?`;
    }).join(', ');
    const values = Object.values(processedData);
    
    // Add updated_at timestamp
    const finalSetClause = setClause ? `${setClause}, updated_at = ?` : 'updated_at = ?';
    const finalValues = setClause ? [...values, new Date().toISOString()] : [new Date().toISOString()];
    
    sqlite.prepare(`UPDATE plays SET ${finalSetClause} WHERE id = ?`).run(...finalValues, id);
    return this.getPlay(id);
  }

  async deletePlay(id: string): Promise<boolean> {
    const result = sqlite.prepare('DELETE FROM plays WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Ticket methods
  async getTickets(userId?: string, playId?: string): Promise<Ticket[]> {
    let query = 'SELECT * FROM tickets';
    const params: any[] = [];
    
    if (userId && playId) {
      query += ' WHERE user_id = ? AND play_id = ?';
      params.push(userId, playId);
    } else if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    } else if (playId) {
      query += ' WHERE play_id = ?';
      params.push(playId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const results = sqlite.prepare(query).all(...params) as any[];
    return results.map(result => ({
      id: result.id,
      userId: result.user_id,
      playId: result.play_id,
      qrCode: result.qr_code,
      seatNumber: result.seat_number,
      status: result.status,
      paidAt: result.paid_at ? new Date(result.paid_at) : null,
      createdAt: new Date(result.created_at),
    }));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const result = sqlite.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any;
    if (!result) return undefined;
    
    return {
      id: result.id,
      userId: result.user_id,
      playId: result.play_id,
      qrCode: result.qr_code,
      seatNumber: result.seat_number,
      status: result.status,
      paidAt: result.paid_at ? new Date(result.paid_at) : null,
      createdAt: new Date(result.created_at),
    };
  }

  async createTicket(insertTicket: InsertTicket & { id?: string }): Promise<Ticket> {
    const ticket: Ticket = {
      id: insertTicket.id || nanoid(),
      userId: insertTicket.userId,
      playId: insertTicket.playId,
      qrCode: insertTicket.qrCode,
      seatNumber: insertTicket.seatNumber || null,
      status: insertTicket.status || "Pendiente",
      paidAt: insertTicket.paidAt || null,
      createdAt: new Date(),
    };
    
    sqlite.prepare(`
      INSERT INTO tickets (id, user_id, play_id, qr_code, seat_number, status, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ticket.id, ticket.userId, ticket.playId, ticket.qrCode, ticket.seatNumber, ticket.status, ticket.paidAt?.toISOString(), ticket.createdAt.toISOString());
    
    return ticket;
  }

  async updateTicketStatus(id: string, status: 'Pendiente' | 'Pagado'): Promise<Ticket | undefined> {
    const paidAt = status === 'Pagado' ? new Date().toISOString() : null;
    
    sqlite.prepare('UPDATE tickets SET status = ?, paid_at = ? WHERE id = ?').run(status, paidAt, id);
    return this.getTicket(id);
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = sqlite.prepare('DELETE FROM tickets WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Gallery methods
  async getGalleryItems(visibility?: string): Promise<GalleryItem[]> {
    let query = 'SELECT * FROM gallery_items ORDER BY created_at DESC';
    const params: any[] = [];
    
    if (visibility) {
      query += ' WHERE visibility = ?';
      params.push(visibility);
    }
    
    return sqlite.prepare(query).all(...params) as GalleryItem[];
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const result = sqlite.prepare('SELECT * FROM gallery_items WHERE id = ?').get(id);
    return result as GalleryItem | undefined;
  }

  async createGalleryItem(insertGalleryItem: InsertGalleryItem): Promise<GalleryItem> {
    const item: GalleryItem = {
      id: nanoid(),
      title: insertGalleryItem.title,
      description: insertGalleryItem.description || null,
      imageUrl: insertGalleryItem.imageUrl,
      type: insertGalleryItem.type || "IMAGE",
      visibility: insertGalleryItem.visibility || "PUBLIC",
      createdBy: insertGalleryItem.createdBy,
      createdAt: new Date(),
    };
    
    sqlite.prepare(`
      INSERT INTO gallery_items (id, title, description, image_url, type, visibility, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(item.id, item.title, item.description, item.imageUrl, item.type, item.visibility, item.createdBy, item.createdAt.toISOString());
    
    return item;
  }

  async updateGalleryItem(id: string, updates: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    sqlite.prepare(`UPDATE gallery_items SET ${setClause} WHERE id = ?`).run(...values, id);
    return this.getGalleryItem(id);
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const result = sqlite.prepare('DELETE FROM gallery_items WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Settings methods
  async getSetting(key: string): Promise<string | undefined> {
    const result = sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
    return result?.value;
  }

  async setSetting(key: string, value: string, updatedBy: string): Promise<void> {
    // Use INSERT OR REPLACE for upsert functionality
    sqlite.prepare(`
      INSERT OR REPLACE INTO settings (id, key, value, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(nanoid(), key, value, updatedBy, new Date().toISOString());
  }

  // Contact methods
  async createContactMessage(insertContactMessage: InsertContactMessage): Promise<ContactMessage> {
    const message: ContactMessage = {
      id: nanoid(),
      name: insertContactMessage.name,
      email: insertContactMessage.email,
      subject: insertContactMessage.subject,
      message: insertContactMessage.message,
      status: insertContactMessage.status || "UNREAD",
      createdAt: new Date(),
    };
    
    sqlite.prepare(`
      INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(message.id, message.name, message.email, message.subject, message.message, message.status, message.createdAt.toISOString());
    
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return sqlite.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all() as ContactMessage[];
  }

  // Validation system methods
  async getWeeklyCode(): Promise<{ code: string; validFrom: string; validTo: string } | undefined> {
    const code = await this.getSetting('weekly_code');
    const validFrom = await this.getSetting('weekly_code_valid_from');
    const validTo = await this.getSetting('weekly_code_valid_to');
    
    if (code && validFrom && validTo) {
      return {
        code,
        validFrom,
        validTo,
      };
    }
    
    return undefined;
  }

  async createValidationLog(log: { ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }): Promise<void> {
    // Store validation logs in settings
    const logKey = `validation_log_${log.ticketId}_${Date.now()}`;
    const logValue = JSON.stringify(log);
    
    // Find an admin user to use for the validation log
    try {
      const adminUser = sqlite.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('ADMIN') as any;
      if (adminUser) {
        await this.setSetting(logKey, logValue, adminUser.id);
      } else {
        // If no admin user exists, skip the validation log (don't fail the payment confirmation)
        console.warn('No admin user found for validation log, skipping log entry');
      }
    } catch (error) {
      // If all else fails, skip the validation log but don't fail the payment confirmation
      console.warn('Failed to create validation log, but continuing with payment confirmation:', error);
    }
  }

  async getValidationLogs(): Promise<{ id: string; ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string }[]> {
    try {
      // Get all settings that start with 'validation_log_'
      const logs = sqlite.prepare("SELECT key, value FROM settings WHERE key LIKE 'validation_log_%' ORDER BY updated_at DESC").all() as any[];
      
      return logs.map(log => {
        try {
          const logData = JSON.parse(log.value);
          return {
            id: log.key,
            ticketId: logData.ticketId,
            validatedAt: logData.validatedAt,
            validatedBy: logData.validatedBy,
            weeklyCode: logData.weeklyCode
          };
        } catch (parseError) {
          console.warn('Failed to parse validation log:', log.key, parseError);
          return null;
        }
      }).filter((log): log is { id: string; ticketId: string; validatedAt: string; validatedBy: string; weeklyCode: string } => log !== null);
    } catch (error) {
      console.error('Error fetching validation logs:', error);
      return [];
    }
  }

  async getValidationStats(): Promise<{
    totalValidations: number;
    todayValidations: number;
    weeklyValidations: number;
    monthlyValidations: number;
    activeWeeklyCode: string;
    lastValidation: string;
    validationRate: number;
  }> {
    try {
      const logs = await this.getValidationLogs();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalValidations = logs.length;
      const todayValidations = logs.filter(log => new Date(log.validatedAt) >= today).length;
      const weeklyValidations = logs.filter(log => new Date(log.validatedAt) >= weekAgo).length;
      const monthlyValidations = logs.filter(log => new Date(log.validatedAt) >= monthAgo).length;

      // Get active weekly code
      const weeklyCode = await this.getWeeklyCode();
      const activeWeeklyCode = weeklyCode && new Date() >= new Date(weeklyCode.validFrom) && new Date() <= new Date(weeklyCode.validTo) 
        ? weeklyCode.code 
        : '';

      // Get last validation
      const lastValidation = logs.length > 0 ? logs[0].validatedAt : '';

      // Calculate validation rate (placeholder - could be based on tickets vs validations)
      const totalTickets = sqlite.prepare('SELECT COUNT(*) as count FROM tickets').get() as any;
      const validationRate = totalTickets.count > 0 ? Math.round((totalValidations / totalTickets.count) * 100) : 0;

      return {
        totalValidations,
        todayValidations,
        weeklyValidations,
        monthlyValidations,
        activeWeeklyCode,
        lastValidation,
        validationRate
      };
    } catch (error) {
      console.error('Error calculating validation stats:', error);
      return {
        totalValidations: 0,
        todayValidations: 0,
        weeklyValidations: 0,
        monthlyValidations: 0,
        activeWeeklyCode: '',
        lastValidation: '',
        validationRate: 0
      };
    }
  }
}

export const storage = new DatabaseStorage(); 