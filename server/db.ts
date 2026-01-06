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
          // Don't overwrite subscription fields on update unless explicitly provided
          ...(user.stripeCustomerId !== undefined && { stripeCustomerId: user.stripeCustomerId }),
          ...(user.subscriptionStatus !== undefined && { subscriptionStatus: user.subscriptionStatus }),
          ...(user.planType !== undefined && { planType: user.planType }),
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
  if (!db) {
    console.warn(`[getUserInvoices] Database not available for user ${userId}`);
    return [];
  }
  
  console.log(`[getUserInvoices] Querying invoices for user ID: ${userId}`);
  const results = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  console.log(`[getUserInvoices] Found ${results.length} invoices for user ${userId}`);
  
  // Debug: Check if there are any invoices with different user IDs
  if (results.length === 0) {
    const allInvoices = await db.select({ userId: invoices.userId, id: invoices.id, fileName: invoices.fileName }).from(invoices).limit(10);
    console.log(`[getUserInvoices] Sample invoices in database (first 10):`, allInvoices.map(i => ({ id: i.id, userId: i.userId, fileName: i.fileName })));
  }
  
  return results as Invoice[];
}

export async function getInvoicesByMonth(userId: string, month: string): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.month, month)))
    .orderBy(desc(invoices.createdAt));
  return results as Invoice[];
}

export async function getInvoice(id: number, userId: string): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .limit(1);
  
  return result[0] as Invoice | undefined;
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(invoices)
    .set({ 
      paymentStatus: isPaid ? "paid" : "pending",
      paidAt: isPaid ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(inArray(invoices.id, ids), eq(invoices.userId, userId)))
    .returning();

  return result.length;
}

/**
 * Check if user can upload more invoices based on their subscription plan
 * Also handles monthly reset of invoice count
 * @param userId - User ID
 * @returns Object with canUpload (boolean) and reason (string) if cannot upload
 */
export async function checkSubscriptionLimit(userId: string): Promise<{ canUpload: boolean; reason?: string; remaining?: number }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Subscription] Database not available");
    return { canUpload: false, reason: "Database not available" };
  }

  const user = await getUser(userId);
  if (!user) {
    return { canUpload: false, reason: "User not found" };
  }

  // Check subscription status - only active and trialing users can upload
  if (user.subscriptionStatus && !["active", "trialing"].includes(user.subscriptionStatus)) {
    return { 
      canUpload: false, 
      reason: `Ihr Abo ist ${user.subscriptionStatus === "canceled" ? "gekündigt" : "überfällig"}. Bitte erneuern Sie Ihr Abo.` 
    };
  }

  // Check if we need to reset the monthly counter
  const now = new Date();
  const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date(user.createdAt);
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  // Reset if it's been more than 30 days since last reset
  if (daysSinceReset >= 30) {
    await db
      .update(users)
      .set({
        invoiceCountMonth: 0,
        lastResetDate: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
    
    // Reset the local user object for the check below
    user.invoiceCountMonth = 0;
  }

  // Check plan limits
  const planType = user.planType || "free";
  
  if (planType === "pro" || planType === "business") {
    // Pro and Business plans have unlimited uploads
    return { canUpload: true };
  }

  // Free plan: max 5 invoices per month
  const freePlanLimit = 5;
  const currentCount = user.invoiceCountMonth || 0;
  
  if (currentCount >= freePlanLimit) {
    return {
      canUpload: false,
      reason: `Sie haben Ihr monatliches Limit von ${freePlanLimit} Rechnungen erreicht. Bitte upgraden Sie auf Pro für unbegrenzte Uploads.`,
      remaining: 0,
    };
  }

  return {
    canUpload: true,
    remaining: freePlanLimit - currentCount,
  };
}

/**
 * Increment the monthly invoice count for a user
 * Should be called after successfully uploading an invoice
 * @param userId - User ID
 */
export async function incrementInvoiceCount(userId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Subscription] Database not available, cannot increment invoice count");
    return;
  }

  // Get current count first
  const user = await getUser(userId);
  if (!user) {
    console.warn("[Subscription] User not found, cannot increment invoice count");
    return;
  }

  const currentCount = user.invoiceCountMonth || 0;

  await db
    .update(users)
    .set({
      invoiceCountMonth: currentCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Update user subscription information
 * @param userId - User ID
 * @param updates - Subscription update fields
 */
export async function updateUserSubscription(
  userId: string,
  updates: {
    stripeCustomerId?: string;
    subscriptionStatus?: "active" | "trialing" | "canceled" | "past_due";
    planType?: "free" | "pro" | "business";
  }
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Subscription] Database not available");
    return undefined;
  }

  try {
    const result = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return result[0];
  } catch (error) {
    console.error("[Subscription] Failed to update subscription:", error);
    throw error;
  }
}

// Type exports
export type { User, InsertUser, Invoice, InsertInvoice, Project, InsertProject, UserSettings, InsertUserSettings, ExportHistory, InsertExportHistory };
