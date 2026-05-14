import session from "express-session";
import { nanoid } from "nanoid";
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Create a direct SQLite connection
const sqlite = new Database('teclaweb.db');
import { 
  type User, type InsertUser, type Post, type InsertPost,
  type Play, type InsertPlay, type Ticket, type InsertTicket,
  type GalleryItem, type InsertGalleryItem, type ContactMessage, type InsertContactMessage,
  type PlayComment, type InsertPlayComment, type PlayMemoryPhoto, type InsertPlayMemoryPhoto
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
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  
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
  
  // Showtimes (grouped plays)
  getPlaysGrouped(): Promise<{ parentPlay: Play; showtimes: Play[] }[]>;
  getShowtimesForPlay(parentPlayId: string): Promise<Play[]>;
  createShowtime(play: InsertPlay, parentPlayId: string): Promise<Play>;

  // Past play memory
  getPlayComments(playId: string, includePending?: boolean): Promise<(PlayComment & { userName: string })[]>;
  createPlayComment(comment: InsertPlayComment): Promise<PlayComment>;
  approvePlayComment(commentId: string): Promise<PlayComment | undefined>;
  rejectPlayComment(commentId: string): Promise<boolean>;
  getPlayMemoryPhotos(playId: string): Promise<PlayMemoryPhoto[]>;
  createPlayMemoryPhoto(photo: InsertPlayMemoryPhoto): Promise<PlayMemoryPhoto>;
  reorderPlayMemoryPhotos(playId: string, photoIds: string[]): Promise<PlayMemoryPhoto[]>;
  deletePlayMemoryPhoto(photoId: string): Promise<boolean>;
  
  // Tickets
  getTickets(userId?: string, playId?: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket & { 
    quantity?: number;
    adultTickets?: number;
    childTickets?: number;
    totalPrice?: number;
  }): Promise<Ticket>;
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
    this.ensureMemoryTables();
  }

  private ensureMemoryTables(): void {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS play_comments (
        id TEXT PRIMARY KEY,
        play_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (play_id) REFERENCES plays(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS play_memory_photos (
        id TEXT PRIMARY KEY,
        play_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        display_order INTEGER DEFAULT 0 NOT NULL,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (play_id) REFERENCES plays(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_play_comments_play_id ON play_comments (play_id);
      CREATE INDEX IF NOT EXISTS idx_play_comments_status ON play_comments (status);
      CREATE INDEX IF NOT EXISTS idx_play_memory_photos_play_id ON play_memory_photos (play_id);
    `);
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

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const result = sqlite.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(
      role, 
      new Date().toISOString(), 
      userId
    );
    
    if (result.changes > 0) {
      return this.getUser(userId);
    }
    return undefined;
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
    
    const results = sqlite.prepare(query).all(...params) as any[];
    return results.map(result => ({
      id: result.id,
      title: result.title,
      content: result.content,
      excerpt: result.excerpt,
      imageUrl: result.image_url, // Transform image_url to imageUrl
      imageOrientation: result.image_orientation, // Transform image_orientation to imageOrientation
      status: result.status,
      createdBy: result.created_by,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    }));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const result = sqlite.prepare('SELECT * FROM posts WHERE id = ?').get(id) as any;
    if (!result) return undefined;
    
    return {
      id: result.id,
      title: result.title,
      content: result.content,
      excerpt: result.excerpt,
      imageUrl: result.image_url, // Transform image_url to imageUrl
      imageOrientation: result.image_orientation, // Transform image_orientation to imageOrientation
      status: result.status,
      createdBy: result.created_by,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const post: Post = {
      id: nanoid(),
      title: insertPost.title,
      content: insertPost.content,
      excerpt: insertPost.excerpt || null,
      imageUrl: insertPost.imageUrl || null,
      imageOrientation: insertPost.imageOrientation || null,
      status: insertPost.status || "PUBLISHED",
      createdBy: insertPost.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    sqlite.prepare(`
      INSERT INTO posts (id, title, content, excerpt, image_url, image_orientation, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(post.id, post.title, post.content, post.excerpt, post.imageUrl, post.imageOrientation, post.status, post.createdBy, post.createdAt.toISOString(), post.updatedAt.toISOString());
    
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
      posterOrientation: result.poster_orientation,
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
      posterOrientation: result.poster_orientation,
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
      posterOrientation: insertPlay.posterOrientation || null,
      dateTime: insertPlay.dateTime,
      basePrice: insertPlay.basePrice || 5.0,
      genre: insertPlay.genre || null,
      createdBy: insertPlay.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert the play with parent_play_id set to itself and showtime_order = 0
    sqlite.prepare(`
      INSERT INTO plays (id, title, description, poster_url, poster_orientation, date_time, base_price, genre, created_by, created_at, updated_at, parent_play_id, showtime_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      play.id, 
      play.title, 
      play.description, 
      play.posterUrl, 
      play.posterOrientation,
      play.dateTime.toISOString(), 
      play.basePrice, 
      play.genre, 
      play.createdBy, 
      play.createdAt.toISOString(), 
      play.updatedAt.toISOString(),
      play.id, // parent_play_id = id (self-referencing)
      0 // showtime_order = 0 (first showtime)
    );
    
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
    // Start transaction for data integrity
    sqlite.prepare('BEGIN TRANSACTION').run();
    
    try {
      // 1. Get play info for image cleanup
      const play = await this.getPlay(id);
      
      // 2. Delete related memory comments/photos
      sqlite.prepare('DELETE FROM play_comments WHERE play_id = ?').run(id);
      sqlite.prepare('DELETE FROM play_memory_photos WHERE play_id = ?').run(id);

      // 3. Delete all related tickets first (foreign key constraint)
      const ticketsDeleted = sqlite.prepare('DELETE FROM tickets WHERE play_id = ?').run(id);
      console.log(`Deleted ${ticketsDeleted.changes} tickets for play ${id}`);
      
      // 4. Delete all showtimes (plays with this parent_play_id)
      const showtimesDeleted = sqlite.prepare('DELETE FROM plays WHERE parent_play_id = ? AND id != ?').run(id, id);
      console.log(`Deleted ${showtimesDeleted.changes} showtimes for play ${id}`);
      
      // 5. Delete the main play
      const playDeleted = sqlite.prepare('DELETE FROM plays WHERE id = ?').run(id);
      console.log(`Deleted main play ${id}`);
      
      // 6. Clean up poster image if exists
      if (play?.posterUrl) {
        const filename = play.posterUrl.split('/').pop();
        if (filename) {
          this.deleteFile(filename);
          console.log(`Deleted poster image: ${filename}`);
        }
      }
      
      // Commit transaction
      sqlite.prepare('COMMIT').run();
      
      const totalDeleted = ticketsDeleted.changes + showtimesDeleted.changes + playDeleted.changes;
      console.log(`Total records deleted: ${totalDeleted}`);
      
      return playDeleted.changes > 0;
      
    } catch (error) {
      // Rollback on error
      sqlite.prepare('ROLLBACK').run();
      console.error('Error deleting play:', error);
      throw error;
    }
  }

  private deleteFile(filename: string): boolean {
    try {
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Showtime methods
  async getPlaysGrouped(): Promise<{ parentPlay: Play; showtimes: Play[] }[]> {
    // Get all plays and group them by parent_play_id
    const results = sqlite.prepare(`
      SELECT * FROM plays 
      ORDER BY parent_play_id, showtime_order, date_time
    `).all() as any[];
    
    const grouped: { [key: string]: { play: Play; showtimeOrder: number | null; parentPlayId: string | null }[] } = {};
    
    results.forEach(result => {
      const play: Play = {
        id: result.id,
        title: result.title,
        description: result.description,
        posterUrl: result.poster_url,
        posterOrientation: result.poster_orientation,
        dateTime: new Date(result.date_time),
        basePrice: result.base_price,
        genre: result.genre,
        createdBy: result.created_by,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at),
      };
      
      const parentId = result.parent_play_id || result.id;
      if (!grouped[parentId]) {
        grouped[parentId] = [];
      }
      grouped[parentId].push({
        play,
        showtimeOrder: result.showtime_order ?? null,
        parentPlayId: result.parent_play_id ?? null,
      });
    });
    
    const now = new Date();
    
    // Convert groups to array, preserving chronological showtimes and stable canonical parent identity.
    const groupedArray = Object.entries(grouped).map(([groupParentId, entries]) => {
      const sortedEntries = [...entries].sort(
        (a, b) => a.play.dateTime.getTime() - b.play.dateTime.getTime()
      );
      const canonicalEntry =
        entries.find((entry) => entry.showtimeOrder === 0) ||
        entries.find((entry) => entry.play.id === groupParentId) ||
        entries.find((entry) => entry.play.id === entry.parentPlayId) ||
        sortedEntries[0];

      return {
        parentPlay: canonicalEntry.play,
        showtimes: sortedEntries.map((entry) => entry.play),
      };
    });
    
    // Sort groups by the closest upcoming date/time (or latest past date if no future dates)
    groupedArray.sort((a, b) => {
      // Find the earliest upcoming showtime for each group
      const aUpcoming = a.showtimes.find(s => s.dateTime.getTime() > now.getTime());
      const bUpcoming = b.showtimes.find(s => s.dateTime.getTime() > now.getTime());
      
      // If both have upcoming dates, sort by earliest upcoming
      if (aUpcoming && bUpcoming) {
        return aUpcoming.dateTime.getTime() - bUpcoming.dateTime.getTime();
      }
      
      // If only one has upcoming dates, prioritize it
      if (aUpcoming && !bUpcoming) {
        return -1;
      }
      if (!aUpcoming && bUpcoming) {
        return 1;
      }
      
      // If neither has upcoming dates, sort by latest past date
      const aLatest = a.showtimes[a.showtimes.length - 1];
      const bLatest = b.showtimes[b.showtimes.length - 1];
      return bLatest.dateTime.getTime() - aLatest.dateTime.getTime();
    });
    
    return groupedArray;
  }

  async getShowtimesForPlay(parentPlayId: string): Promise<Play[]> {
    // Resolve canonical parent ID so child showtime IDs return the full group.
    const requestedPlay = sqlite.prepare(`
      SELECT id, parent_play_id, showtime_order
      FROM plays
      WHERE id = ?
    `).get(parentPlayId) as any;

    if (!requestedPlay) {
      return [];
    }

    const canonicalParentId =
      requestedPlay.showtime_order === 0 ||
      !requestedPlay.parent_play_id ||
      requestedPlay.id === requestedPlay.parent_play_id
        ? requestedPlay.id
        : requestedPlay.parent_play_id;

    // Get the parent play and all its showtimes, including the parent itself.
    const results = sqlite.prepare(`
      SELECT * FROM plays 
      WHERE parent_play_id = ? OR id = ?
      ORDER BY showtime_order, date_time
    `).all(canonicalParentId, canonicalParentId) as any[];
    
    return results.map(result => ({
      id: result.id,
      title: result.title,
      description: result.description,
      posterUrl: result.poster_url,
      posterOrientation: result.poster_orientation,
      dateTime: new Date(result.date_time),
      basePrice: result.base_price,
      genre: result.genre,
      createdBy: result.created_by,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    }));
  }

  async createShowtime(play: InsertPlay, parentPlayId: string): Promise<Play> {
    // Get the next showtime order
    const maxOrder = sqlite.prepare(`
      SELECT MAX(showtime_order) as max_order 
      FROM plays 
      WHERE parent_play_id = ?
    `).get(parentPlayId) as any;
    
    const nextOrder = (maxOrder?.max_order || 0) + 1;
    
    const newShowtime: Play = {
      id: nanoid(),
      title: play.title,
      description: play.description,
      posterUrl: play.posterUrl || null,
      posterOrientation: play.posterOrientation || null,
      dateTime: play.dateTime,
      basePrice: play.basePrice || 5.0,
      genre: play.genre || null,
      createdBy: play.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    sqlite.prepare(`
      INSERT INTO plays (id, title, description, poster_url, poster_orientation, date_time, base_price, genre, created_by, created_at, updated_at, parent_play_id, showtime_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newShowtime.id, 
      newShowtime.title, 
      newShowtime.description, 
      newShowtime.posterUrl, 
      newShowtime.posterOrientation,
      newShowtime.dateTime.toISOString(), 
      newShowtime.basePrice, 
      newShowtime.genre, 
      newShowtime.createdBy, 
      newShowtime.createdAt.toISOString(), 
      newShowtime.updatedAt.toISOString(),
      parentPlayId, 
      nextOrder
    );
    
    return newShowtime;
  }

  // Past play memory methods
  async getPlayComments(playId: string, includePending: boolean = false): Promise<(PlayComment & { userName: string })[]> {
    const statusFilter = includePending ? '' : `AND c.status = 'approved'`;
    const results = sqlite.prepare(`
      SELECT c.*, u.name as user_name
      FROM play_comments c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.play_id = ?
      ${statusFilter}
      ORDER BY c.created_at DESC
    `).all(playId) as any[];

    return results.map((result) => ({
      id: result.id,
      playId: result.play_id,
      userId: result.user_id,
      content: result.content,
      status: result.status,
      createdAt: new Date(result.created_at),
      userName: result.user_name,
    }));
  }

  async createPlayComment(insertComment: InsertPlayComment): Promise<PlayComment> {
    const comment: PlayComment = {
      id: nanoid(),
      playId: insertComment.playId,
      userId: insertComment.userId,
      content: insertComment.content,
      status: insertComment.status ?? "pending",
      createdAt: new Date(),
    };

    sqlite.prepare(`
      INSERT INTO play_comments (id, play_id, user_id, content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      comment.id,
      comment.playId,
      comment.userId,
      comment.content,
      comment.status,
      comment.createdAt.toISOString(),
    );

    return comment;
  }

  async approvePlayComment(commentId: string): Promise<PlayComment | undefined> {
    const result = sqlite.prepare(`
      UPDATE play_comments
      SET status = 'approved'
      WHERE id = ?
    `).run(commentId);

    if (result.changes === 0) {
      return undefined;
    }

    const row = sqlite.prepare(`SELECT * FROM play_comments WHERE id = ?`).get(commentId) as any;
    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      playId: row.play_id,
      userId: row.user_id,
      content: row.content,
      status: row.status,
      createdAt: new Date(row.created_at),
    };
  }

  async rejectPlayComment(commentId: string): Promise<boolean> {
    const result = sqlite.prepare(`DELETE FROM play_comments WHERE id = ?`).run(commentId);
    return result.changes > 0;
  }

  async getPlayMemoryPhotos(playId: string): Promise<PlayMemoryPhoto[]> {
    const results = sqlite.prepare(`
      SELECT * FROM play_memory_photos
      WHERE play_id = ?
      ORDER BY display_order ASC, created_at ASC
    `).all(playId) as any[];

    return results.map((result) => ({
      id: result.id,
      playId: result.play_id,
      imageUrl: result.image_url,
      displayOrder: result.display_order,
      createdBy: result.created_by,
      createdAt: new Date(result.created_at),
    }));
  }

  async createPlayMemoryPhoto(insertPhoto: InsertPlayMemoryPhoto): Promise<PlayMemoryPhoto> {
    const countResult = sqlite.prepare(`
      SELECT COUNT(*) as count FROM play_memory_photos WHERE play_id = ?
    `).get(insertPhoto.playId) as any;

    if ((countResult?.count ?? 0) >= 3) {
      throw new Error("Solo se permiten hasta 3 fotos por obra");
    }

    const nextOrderResult = sqlite.prepare(`
      SELECT COALESCE(MAX(display_order), -1) as max_order
      FROM play_memory_photos
      WHERE play_id = ?
    `).get(insertPhoto.playId) as any;

    const photo: PlayMemoryPhoto = {
      id: nanoid(),
      playId: insertPhoto.playId,
      imageUrl: insertPhoto.imageUrl,
      displayOrder: (nextOrderResult?.max_order ?? -1) + 1,
      createdBy: insertPhoto.createdBy,
      createdAt: new Date(),
    };

    sqlite.prepare(`
      INSERT INTO play_memory_photos (id, play_id, image_url, display_order, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      photo.id,
      photo.playId,
      photo.imageUrl,
      photo.displayOrder,
      photo.createdBy,
      photo.createdAt.toISOString(),
    );

    return photo;
  }

  async reorderPlayMemoryPhotos(playId: string, photoIds: string[]): Promise<PlayMemoryPhoto[]> {
    sqlite.prepare('BEGIN TRANSACTION').run();
    try {
      photoIds.slice(0, 3).forEach((photoId, index) => {
        sqlite.prepare(`
          UPDATE play_memory_photos
          SET display_order = ?
          WHERE id = ? AND play_id = ?
        `).run(index, photoId, playId);
      });
      sqlite.prepare('COMMIT').run();
    } catch (error) {
      sqlite.prepare('ROLLBACK').run();
      throw error;
    }

    return this.getPlayMemoryPhotos(playId);
  }

  async deletePlayMemoryPhoto(photoId: string): Promise<boolean> {
    const result = sqlite.prepare(`DELETE FROM play_memory_photos WHERE id = ?`).run(photoId);
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
      quantity: result.quantity || 1,
      adultTickets: result.adult_tickets || 1,
      childTickets: result.child_tickets || 0,
      totalPrice: result.total_price || 0.0,
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
      quantity: result.quantity || 1,
      adultTickets: result.adult_tickets || 1,
      childTickets: result.child_tickets || 0,
      totalPrice: result.total_price || 0.0,
    };
  }

  async createTicket(insertTicket: InsertTicket & { 
    id?: string;
    quantity?: number;
    adultTickets?: number;
    childTickets?: number;
    totalPrice?: number;
  }): Promise<Ticket> {
    const ticket: Ticket = {
      id: insertTicket.id || nanoid(),
      userId: insertTicket.userId,
      playId: insertTicket.playId,
      qrCode: insertTicket.qrCode,
      seatNumber: insertTicket.seatNumber || null,
      status: insertTicket.status || "Pendiente",
      paidAt: insertTicket.paidAt || null,
      createdAt: new Date(),
      quantity: insertTicket.quantity || 1,
      adultTickets: insertTicket.adultTickets || 1,
      childTickets: insertTicket.childTickets || 0,
      totalPrice: insertTicket.totalPrice || 0.0,
    };
    
    sqlite.prepare(`
      INSERT INTO tickets (id, user_id, play_id, qr_code, seat_number, status, paid_at, created_at, quantity, adult_tickets, child_tickets, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticket.id, 
      ticket.userId, 
      ticket.playId, 
      ticket.qrCode, 
      ticket.seatNumber, 
      ticket.status, 
      ticket.paidAt?.toISOString(), 
      ticket.createdAt.toISOString(),
      ticket.quantity,
      ticket.adultTickets,
      ticket.childTickets,
      ticket.totalPrice
    );
    
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

  // Helper method for calculating group ticket pricing
  calculateGroupPrice(basePrice: number, adultTickets: number, childTickets: number): number {
    const adultTotal = adultTickets * basePrice;
    const childTotal = Math.ceil(childTickets / 2) * basePrice; // 1 ticket per 2 children
    return adultTotal + childTotal;
  }

  // Helper method to get play base price
  async getPlayBasePrice(playId: string): Promise<number> {
    const result = sqlite.prepare('SELECT base_price FROM plays WHERE id = ?').get(playId) as any;
    return result ? result.base_price : 0;
  }

  // Play Statistics methods
  async getPlayStatistics(playId: string): Promise<any> {
    const result = sqlite.prepare(`
      SELECT 
        p.title,
        p.base_price,
        COUNT(t.id) as total_ticket_records,
        SUM(t.quantity) as total_people,
        COUNT(CASE WHEN t.status = 'Pagado' THEN 1 END) as paid_ticket_records,
        SUM(CASE WHEN t.status = 'Pagado' THEN t.quantity ELSE 0 END) as paid_people,
        COUNT(CASE WHEN t.status = 'Pendiente' THEN 1 END) as pending_ticket_records,
        SUM(CASE WHEN t.status = 'Pendiente' THEN t.quantity ELSE 0 END) as pending_people,
        ROUND(
          CASE 
            WHEN SUM(t.quantity) > 0 
            THEN SUM(CASE WHEN t.status = 'Pagado' THEN t.quantity ELSE 0 END) * 100.0 / SUM(t.quantity)
            ELSE 0 
          END, 2
        ) as payment_rate,
        SUM(t.total_price) as money_expected,
        SUM(CASE WHEN t.status = 'Pagado' THEN t.total_price ELSE 0 END) as money_gathered,
        SUM(CASE WHEN t.status = 'Pendiente' THEN t.total_price ELSE 0 END) as outstanding_amount,
        CASE 
          WHEN SUM(CASE WHEN t.status = 'Pagado' THEN t.quantity ELSE 0 END) > 0 
          THEN ROUND(SUM(CASE WHEN t.status = 'Pagado' THEN t.total_price ELSE 0 END) / SUM(CASE WHEN t.status = 'Pagado' THEN t.quantity ELSE 0 END), 2)
          ELSE 0 
        END as avg_revenue_per_person,
        MAX(t.created_at) as last_ticket_date,
        MIN(t.created_at) as first_ticket_date
      FROM plays p
      LEFT JOIN tickets t ON p.id = t.play_id
      WHERE p.id = ?
      GROUP BY p.id, p.title, p.base_price
    `).get(playId) as any;
    
    if (!result) return null;
    
    return {
      playId,
      playTitle: result.title,
      basePrice: result.base_price,
      totalTicketRecords: result.total_ticket_records,
      totalPeople: result.total_people,
      paidTicketRecords: result.paid_ticket_records,
      paidPeople: result.paid_people,
      pendingTicketRecords: result.pending_ticket_records,
      pendingPeople: result.pending_people,
      paymentRate: result.payment_rate,
      moneyExpected: result.money_expected,
      moneyGathered: result.money_gathered,
      outstandingAmount: result.outstanding_amount,
      averageRevenuePerPerson: result.avg_revenue_per_person,
      lastTicketDate: result.last_ticket_date ? new Date(result.last_ticket_date) : null,
      firstTicketDate: result.first_ticket_date ? new Date(result.first_ticket_date) : null,
    };
  }

  // User Management methods
  async getAllUsers(): Promise<User[]> {
    const users = sqlite.prepare(`
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all() as any[];
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: null,
      googleId: null,
      role: user.role,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }));
  }

  async getUsersByRole(role?: string): Promise<User[]> {
    if (!role) return this.getAllUsers();
    
    const users = sqlite.prepare(`
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE role = ?
      ORDER BY created_at DESC
    `).all(role) as any[];
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: null,
      googleId: null,
      role: user.role,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }));
  }

  async getUserEmailList(): Promise<{ id: string; email: string; name: string; role: string; createdAt: string }[]> {
    const users = sqlite.prepare(`
      SELECT id, email, name, role, created_at
      FROM users
      ORDER BY name ASC
    `).all() as any[];
    
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    }));
  }

  async getUserStatistics(): Promise<{
    totalUsers: number;
    adminCount: number;
    monitorCount: number;
    userCount: number;
    recentUsers: number;
    activeUsers: number;
  }> {
    const result = sqlite.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'MONITOR' THEN 1 END) as monitor_count,
        COUNT(CASE WHEN role = 'USER' THEN 1 END) as user_count,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as recent_users,
        COUNT(CASE WHEN updated_at >= date('now', '-7 days') THEN 1 END) as active_users
      FROM users
    `).get() as any;
    
    return {
      totalUsers: result.total_users,
      adminCount: result.admin_count,
      monitorCount: result.monitor_count,
      userCount: result.user_count,
      recentUsers: result.recent_users,
      activeUsers: result.active_users,
    };
  }

  // Gallery methods
  async getGalleryItems(visibility?: string): Promise<GalleryItem[]> {
    let query = 'SELECT * FROM gallery_items';
    const params: any[] = [];
    
    if (visibility) {
      query += ' WHERE visibility = ?';
      params.push(visibility);
    }
    
    query += ' ORDER BY created_at DESC';
    
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