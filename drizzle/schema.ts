import { pgTable, serial, text, timestamp, varchar, integer, pgEnum, boolean, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["processing", "completed", "failed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue"]);
export const teamRoleEnum = pgEnum("team_role", ["owner", "admin", "member", "viewer"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "trialing", "canceled", "past_due"]);
export const planTypeEnum = pgEnum("plan_type", ["free", "pro", "business"]);

/**
 * Users table - linked to Supabase Auth
 * The id here matches the Supabase Auth user UUID
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Supabase Auth UUID
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  role: userRoleEnum("role").default("user").notNull(),
  // Subscription fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("active"),
  planType: planTypeEnum("plan_type").default("free").notNull(),
  invoiceCountMonth: integer("invoice_count_month").default(0).notNull(),
  lastResetDate: timestamp("last_reset_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Teams table - for team collaboration
 */
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Team members table - users in a team
 */
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: teamRoleEnum("role").default("member").notNull(),
  invitedBy: text("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Team invitations - pending invites
 */
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  role: teamRoleEnum("role").default("member").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  invitedBy: text("invited_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

/**
 * Projects table - for organizing invoices by project
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#000000"), // Hex color
  budget: integer("budget"), // Budget in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Invoices table - stores uploaded invoice PDFs and extracted data
 */
// @ts-expect-error - Circular reference for duplicateOfId, but works at runtime
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "cascade" }),
  
  // File info
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(), // Supabase Storage path
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  
  // Extracted data
  toolName: varchar("tool_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  amount: integer("amount").notNull(), // stored in cents to avoid decimal issues
  currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
  invoiceDate: timestamp("invoice_date"),
  period: varchar("period", { length: 255 }),
  
  // Project assignment
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  
  // Month for grouping (YYYY-MM format)
  month: varchar("month", { length: 7 }).notNull(),
  
  // Payment tracking
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  
  // Recurring invoice tracking
  isRecurring: boolean("is_recurring").default(false),
  recurringGroupId: varchar("recurring_group_id", { length: 255 }), // Groups recurring invoices together
  
  // Duplicate detection
  contentHash: varchar("content_hash", { length: 64 }), // SHA-256 hash of key fields for duplicate detection
  isDuplicate: boolean("is_duplicate").default(false),
  // @ts-expect-error - Circular reference, but works at runtime
  duplicateOfId: integer("duplicate_of_id").references(() => invoices.id, { onDelete: "set null" }),
  
  // Notes
  notes: text("notes"),
  
  // Processing status
  status: invoiceStatusEnum("status").default("processing").notNull(),
  extractionError: text("extraction_error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * User Settings table - stores user preferences
 */
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  defaultExchangeRate: varchar("default_exchange_rate", { length: 10 }).default("1.0"), // Default exchange rate for exports
  defaultExportFormat: varchar("default_export_format", { length: 20 }).default("excel"), // excel, datev, pdf
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Export History table - tracks all exports
 */
export const exportHistory = pgTable("export_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exportType: varchar("export_type", { length: 20 }).notNull(), // monthly, datev, pdf, custom
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(), // Supabase Storage path
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  invoiceCount: integer("invoice_count").notNull().default(0),
  month: varchar("month", { length: 7 }), // For monthly exports
  parameters: text("parameters"), // JSON string with export parameters
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;
