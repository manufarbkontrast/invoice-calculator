import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertInvoice, InsertProject, InsertUser, Invoice, invoices, Project, projects, User, users, UserSettings, InsertUserSettings, userSettings, ExportHistory, InsertExportHistory, exportHistory } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _sql = postgres(process.env.DATABASE_URL);
      _db = drizzle(_sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function createUser(user: InsertUser): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create user: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUser(user: InsertUser): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return undefined;
  }

  try {
    const result = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          name: user.name,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// Invoice operations
export async function createInvoice(invoice: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoices).values(invoice).returning();
  if (!result[0]) throw new Error("Failed to create invoice");
  
  return result[0];
}

export async function updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(invoices).set({ ...updates, updatedAt: new Date() }).where(eq(invoices.id, id));
}

export async function getUserInvoices(userId: string): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
}

export async function getInvoicesByMonth(userId: string, month: string): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.month, month)))
    .orderBy(desc(invoices.createdAt));
}

export async function getInvoice(id: number, userId: string): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function deleteInvoice(id: number, userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
}

// Project operations
export async function createProject(project: InsertProject): Promise<Project> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project).returning();
  if (!result[0]) throw new Error("Failed to create project");
  
  return result[0];
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function updateProject(id: number, updates: Partial<InsertProject>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set({ ...updates, updatedAt: new Date() }).where(eq(projects.id, id));
}

export async function deleteProject(id: number, userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove project assignment from invoices
  await db.update(invoices).set({ projectId: null }).where(eq(invoices.projectId, id));
  
  // Delete project
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

// Initialize default projects for new users
export async function initializeDefaultProjects(userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existingProjects = await getUserProjects(userId);
  
  // Only create defaults if user has no projects
  if (existingProjects.length === 0) {
    const defaultProjects = [
      { userId, name: "Social", color: "#000000", description: "Social Media Tools & Services" },
      { userId, name: "Force4Good", color: "#1e40af", description: "Force4Good Projekt" },
    ];
    
    for (const project of defaultProjects) {
      await createProject(project);
    }
  }
}

// User Settings operations
export async function getUserSettings(userId: string): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(userSettings)
    .values(settings)
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        defaultExchangeRate: settings.defaultExchangeRate,
        defaultExportFormat: settings.defaultExportFormat,
        emailNotifications: settings.emailNotifications,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!result[0]) throw new Error("Failed to upsert user settings");
  return result[0];
}

// Export History operations
export async function createExportHistory(exportData: InsertExportHistory): Promise<ExportHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(exportHistory).values(exportData).returning();
  if (!result[0]) throw new Error("Failed to create export history");
  return result[0];
}

export async function getUserExportHistory(userId: string, limit: number = 50): Promise<ExportHistory[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select()
    .from(exportHistory)
    .where(eq(exportHistory.userId, userId))
    .orderBy(desc(exportHistory.createdAt))
    .limit(limit);
  
  return results as ExportHistory[];
}

export async function getExportHistory(id: number, userId: string): Promise<ExportHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(exportHistory)
    .where(and(eq(exportHistory.id, id), eq(exportHistory.userId, userId)))
    .limit(1);

  return result[0];
}

export async function deleteExportHistory(id: number, userId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(exportHistory)
    .where(and(eq(exportHistory.id, id), eq(exportHistory.userId, userId)));
}

// Bulk invoice operations
export async function bulkDeleteInvoices(ids: number[], userId: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify all invoices belong to user
  const userInvoices = await db.select()
    .from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      inArray(invoices.id, ids)
    ));

  if (userInvoices.length !== ids.length) {
    throw new Error("Some invoices not found or unauthorized");
  }

  const result = await db.delete(invoices)
    .where(and(
      eq(invoices.userId, userId),
      inArray(invoices.id, ids)
    ));

  return ids.length;
}

export async function bulkUpdateInvoices(ids: number[], userId: string, updates: Partial<InsertInvoice>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify all invoices belong to user
  const userInvoices = await db.select()
    .from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      inArray(invoices.id, ids)
    ));

  if (userInvoices.length !== ids.length) {
    throw new Error("Some invoices not found or unauthorized");
  }

  await db.update(invoices)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(invoices.userId, userId),
      inArray(invoices.id, ids)
    ));

  return ids.length;
}

export async function bulkAssignToProject(ids: number[], userId: string, projectId: number | null): Promise<number> {
  return bulkUpdateInvoices(ids, userId, { projectId });
}

export async function bulkMarkAsPaid(ids: number[], userId: string, isPaid: boolean): Promise<number> {
  return bulkUpdateInvoices(ids, userId, {
    paymentStatus: isPaid ? "paid" : "pending",
    paidAt: isPaid ? new Date() : null,
  });
}

// Type exports
export type { User, InsertUser, Invoice, InsertInvoice, Project, InsertProject, UserSettings, InsertUserSettings, ExportHistory, InsertExportHistory };
