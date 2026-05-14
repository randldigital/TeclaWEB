import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, real, json, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["ADMIN", "MONITOR", "USER"]);
export const statusEnum = pgEnum("status", ["PUBLISHED", "DRAFT", "HIDDEN"]);
export const visibilityEnum = pgEnum("visibility", ["PUBLIC", "PRIVATE"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  googleId: text("google_id"),
  name: text("name").notNull(),
  role: roleEnum("role").default("USER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  imageOrientation: text("image_orientation"), // 'landscape', 'portrait', 'square'
  status: statusEnum("status").default("PUBLISHED").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plays = pgTable("plays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  posterUrl: text("poster_url"),
  posterOrientation: text("poster_orientation"), // 'landscape', 'portrait', 'square'
  dateTime: timestamp("date_time").notNull(),
  basePrice: real("base_price").default(5.0).notNull(),
  genre: text("genre"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  playId: varchar("play_id").notNull().references(() => plays.id),
  qrCode: text("qr_code").notNull(),
  seatNumber: text("seat_number"),
  status: text("status").default("Pendiente").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Group booking fields
  quantity: integer("quantity").default(1).notNull(),
  adultTickets: integer("adult_tickets").default(1).notNull(),
  childTickets: integer("child_tickets").default(0).notNull(),
  totalPrice: real("total_price").default(0.0).notNull(),
});

export const galleryItems = pgTable("gallery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  type: text("type").default("IMAGE").notNull(), // IMAGE, VIDEO
  visibility: visibilityEnum("visibility").default("PUBLIC").notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playComments = pgTable("play_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playId: varchar("play_id").notNull().references(() => plays.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), // pending | approved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playMemoryPhotos = pgTable("play_memory_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playId: varchar("play_id").notNull().references(() => plays.id),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("UNREAD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  plays: many(plays),
  tickets: many(tickets),
  galleryItems: many(galleryItems),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.createdBy],
    references: [users.id],
  }),
}));

export const playsRelations = relations(plays, ({ one, many }) => ({
  author: one(users, {
    fields: [plays.createdBy],
    references: [users.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  play: one(plays, {
    fields: [tickets.playId],
    references: [plays.id],
  }),
}));

export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  author: one(users, {
    fields: [galleryItems.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const baseInsertPlaySchema = createInsertSchema(plays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlaySchema = baseInsertPlaySchema.extend({
  dateTime: z.union([z.date(), z.string()]).transform((val) => 
    val instanceof Date ? val : new Date(val)
  )
});

export const updatePlaySchema = baseInsertPlaySchema.partial().extend({
  dateTime: z.union([z.date(), z.string()]).transform((val) => 
    val instanceof Date ? val : new Date(val)
  ).optional()
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  quantity: true,
  adultTickets: true,
  childTickets: true,
  totalPrice: true,
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export const insertPlayCommentSchema = createInsertSchema(playComments).omit({
  id: true,
  createdAt: true,
});

export const insertPlayMemoryPhotoSchema = createInsertSchema(playMemoryPhotos).omit({
  id: true,
  createdAt: true,
  displayOrder: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Play = typeof plays.$inferSelect;
export type InsertPlay = z.infer<typeof insertPlaySchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type PlayComment = typeof playComments.$inferSelect;
export type InsertPlayComment = z.infer<typeof insertPlayCommentSchema>;
export type PlayMemoryPhoto = typeof playMemoryPhotos.$inferSelect;
export type InsertPlayMemoryPhoto = z.infer<typeof insertPlayMemoryPhotoSchema>;
