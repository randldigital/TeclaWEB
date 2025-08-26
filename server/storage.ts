import { 
  users, posts, plays, tickets, galleryItems, settings, contactMessages,
  type User, type InsertUser, type Post, type InsertPost,
  type Play, type InsertPlay, type Ticket, type InsertTicket,
  type GalleryItem, type InsertGalleryItem, type ContactMessage, type InsertContactMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Posts
  async getPosts(limit: number = 50, status?: string): Promise<Post[]> {
    let query = db.select().from(posts).orderBy(desc(posts.createdAt));
    
    if (status) {
      query = query.where(eq(posts.status, status as any));
    }
    
    return await query.limit(limit);
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    return newPost;
  }

  async updatePost(id: string, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.rowCount > 0;
  }

  // Plays
  async getPlays(limit: number = 50): Promise<Play[]> {
    return await db.select().from(plays).orderBy(desc(plays.dateTime)).limit(limit);
  }

  async getPlay(id: string): Promise<Play | undefined> {
    const [play] = await db.select().from(plays).where(eq(plays.id, id));
    return play || undefined;
  }

  async createPlay(play: InsertPlay): Promise<Play> {
    const [newPlay] = await db
      .insert(plays)
      .values(play)
      .returning();
    return newPlay;
  }

  async updatePlay(id: string, updates: Partial<InsertPlay>): Promise<Play | undefined> {
    const [play] = await db
      .update(plays)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(plays.id, id))
      .returning();
    return play || undefined;
  }

  async deletePlay(id: string): Promise<boolean> {
    const result = await db.delete(plays).where(eq(plays.id, id));
    return result.rowCount > 0;
  }

  // Tickets
  async getTickets(userId?: string, playId?: string): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    if (userId && playId) {
      query = query.where(and(eq(tickets.userId, userId), eq(tickets.playId, playId)));
    } else if (userId) {
      query = query.where(eq(tickets.userId, userId));
    } else if (playId) {
      query = query.where(eq(tickets.playId, playId));
    }
    
    return await query.orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return result.rowCount > 0;
  }

  // Gallery
  async getGalleryItems(visibility?: string): Promise<GalleryItem[]> {
    let query = db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt));
    
    if (visibility) {
      query = query.where(eq(galleryItems.visibility, visibility as any));
    }
    
    return await query;
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
    return item || undefined;
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const [newItem] = await db
      .insert(galleryItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateGalleryItem(id: string, updates: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const [item] = await db
      .update(galleryItems)
      .set(updates)
      .where(eq(galleryItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const result = await db.delete(galleryItems).where(eq(galleryItems.id, id));
    return result.rowCount > 0;
  }

  // Settings
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string, updatedBy: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value, updatedBy })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedBy, updatedAt: new Date() }
      });
  }

  // Contact
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }
}

export const storage = new DatabaseStorage();
