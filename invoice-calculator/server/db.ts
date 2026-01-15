import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertInvoice, InsertProject, InsertUser, Invoice, invoices, Project, projects, users } from "../drizzle/schema";

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

// Type exports
export type { User, InsertUser, Invoice, InsertInvoice, Project, InsertProject };
