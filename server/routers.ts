import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createInvoice, createProject, deleteInvoice, deleteProject, getInvoice, getInvoicesByMonth, getUserInvoices, getUserProjects, updateInvoice, updateProject, getDb, initializeDefaultProjects, getUserSettings, upsertUserSettings, createExportHistory, getUserExportHistory, getExportHistory, deleteExportHistory, bulkDeleteInvoices, bulkUpdateInvoices, bulkAssignToProject, bulkMarkAsPaid, getUser } from "./db";
import { extractInvoiceData, extractInvoiceDataFromImage, isImageFile, isPdfFile } from "./pdfExtractor";
import { generateMonthlyExcel, generateDatevExport, generatePdfReport } from "./excelExporter";
import { storagePut } from "./storage";
import { invoices, projects, teams, teamMembers, teamInvitations } from "../drizzle/schema";
import { eq, and, or, ilike, desc, gte, lte, inArray } from "drizzle-orm";
import crypto from "crypto";

// Helper: Generate content hash for duplicate detection
function generateContentHash(toolName: string, companyName: string, amount: number, invoiceDate: Date | null): string {
  const content = `${toolName}|${companyName}|${amount}|${invoiceDate?.toISOString() || ''}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Helper: Check for duplicates
async function checkForDuplicate(db: any, userId: string, contentHash: string): Promise<number | null> {
  const existing = await db.select()
    .from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      eq(invoices.contentHash, contentHash)
    ))
    .limit(1);
  
  return existing.length > 0 ? existing[0].id : null;
}

// Helper: Detect recurring invoice group
function detectRecurringGroup(toolName: string, companyName: string): string {
  return `${toolName?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}_${companyName?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`;
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),

  invoices: router({
    // Upload and process invoice
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(),
        fileSize: z.number(),
        fileType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const mimeType = input.fileType || "application/pdf";
          const isImage = isImageFile(mimeType);
          const isPdf = isPdfFile(mimeType);
          
          if (!isImage && !isPdf) {
            throw new Error("Nicht unterstützter Dateityp. Bitte PDF oder Bild hochladen.");
          }
          
          const fileBuffer = Buffer.from(input.fileData, 'base64');
          const filePath = `${ctx.user.id}/${Date.now()}-${input.fileName}`;
          
          console.log(`[Upload] Uploading file: ${input.fileName} (${input.fileSize} bytes, type: ${mimeType})`);
          const { url: fileUrl, path: storagePath } = await storagePut(
            `invoices/${filePath}`,
            fileBuffer,
            mimeType
          );
          console.log(`[Upload] File uploaded successfully: ${fileUrl}`);

          const now = new Date();
          const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

          console.log(`[Upload] Creating invoice record for user: ${ctx.user.id}`);
          const invoice = await createInvoice({
            userId: ctx.user.id,
            fileName: input.fileName,
            filePath: storagePath,
            fileUrl,
            fileSize: input.fileSize,
            month: initialMonth,
            amount: 0,
            currency: "EUR",
            status: "processing",
          });
          console.log(`[Upload] Invoice created with ID: ${invoice.id}`);

          const extractionIsImage = isImage;
          (async () => {
            try {
              console.log(`[Upload] Starting data extraction for invoice ${invoice.id}`);
              const extractedData = extractionIsImage 
                ? await extractInvoiceDataFromImage(fileUrl)
                : await extractInvoiceData(fileUrl);
              console.log(`[Upload] Data extracted successfully:`, extractedData);
              
              let month = initialMonth;
              if (extractedData.invoiceDate) {
                const invoiceYear = extractedData.invoiceDate.getFullYear();
                const invoiceMonth = extractedData.invoiceDate.getMonth() + 1;
                month = `${invoiceYear}-${String(invoiceMonth).padStart(2, "0")}`;
              }
              
              // Generate content hash for duplicate detection
              const contentHash = generateContentHash(
                extractedData.toolName,
                extractedData.companyName,
                extractedData.amount,
                extractedData.invoiceDate
              );
              
              // Check for duplicates
              const db = await getDb();
              let isDuplicate = false;
              let duplicateOfId: number | null = null;
              
              if (db) {
                duplicateOfId = await checkForDuplicate(db, ctx.user.id, contentHash);
                isDuplicate = duplicateOfId !== null;
              }
              
              // Detect recurring group
              const recurringGroupId = detectRecurringGroup(extractedData.toolName, extractedData.companyName);
              
              // Check if this is a recurring invoice
              let isRecurring = false;
              if (db) {
                const existingInGroup = await db.select()
                  .from(invoices)
                  .where(and(
                    eq(invoices.userId, ctx.user.id),
                    eq(invoices.recurringGroupId, recurringGroupId)
                  ))
                  .limit(1);
                isRecurring = existingInGroup.length > 0;
              }
              
              await updateInvoice(invoice.id, {
                toolName: extractedData.toolName,
                companyName: extractedData.companyName,
                amount: extractedData.amount,
                currency: extractedData.currency,
                invoiceDate: extractedData.invoiceDate,
                period: extractedData.period,
                month,
                status: "completed",
                contentHash,
                isDuplicate,
                duplicateOfId,
                recurringGroupId,
                isRecurring,
              });
              console.log(`[Upload] Invoice ${invoice.id} updated successfully`);
            } catch (error) {
              console.error(`[Upload] Extraction failed for invoice ${invoice.id}:`, error);
              await updateInvoice(invoice.id, {
                status: "failed",
                extractionError: error instanceof Error ? error.message : String(error),
              });
            }
          })();

          return invoice;
        } catch (error) {
          console.error(`[Upload] Upload failed:`, error);
          throw new Error(
            error instanceof Error 
              ? error.message 
              : `Upload failed: ${String(error)}`
          );
        }
      }),

    // List all invoices
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserInvoices(ctx.user.id);
    }),

    // Global search
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const searchPattern = `%${input.query}%`;
        
        const results = await db.select()
          .from(invoices)
          .where(and(
            eq(invoices.userId, ctx.user.id),
            or(
              ilike(invoices.toolName, searchPattern),
              ilike(invoices.companyName, searchPattern),
              ilike(invoices.fileName, searchPattern),
              ilike(invoices.notes, searchPattern)
            )
          ))
          .orderBy(desc(invoices.createdAt))
          .limit(input.limit);
        
        return results;
      }),

    // Advanced search with filters
    advancedSearch: protectedProcedure
      .input(z.object({
        query: z.string().optional(),
        toolName: z.string().optional(),
        companyName: z.string().optional(),
        status: z.enum(["processing", "completed", "failed"]).optional(),
        paymentStatus: z.enum(["pending", "paid", "overdue"]).optional(),
        projectId: z.number().optional().nullable(),
        month: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        amountMin: z.number().optional(),
        amountMax: z.number().optional(),
        currency: z.string().optional(),
        limit: z.number().optional().default(100),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { results: [], total: 0 };
        
        const conditions = [eq(invoices.userId, ctx.user.id)];
        
        if (input.query) {
          const searchPattern = `%${input.query}%`;
          conditions.push(
            or(
              ilike(invoices.toolName, searchPattern),
              ilike(invoices.companyName, searchPattern),
              ilike(invoices.fileName, searchPattern),
              ilike(invoices.notes, searchPattern)
            )!
          );
        }
        
        if (input.toolName) {
          conditions.push(ilike(invoices.toolName, `%${input.toolName}%`)!);
        }
        
        if (input.companyName) {
          conditions.push(ilike(invoices.companyName, `%${input.companyName}%`)!);
        }
        
        if (input.status) {
          conditions.push(eq(invoices.status, input.status));
        }
        
        if (input.paymentStatus) {
          conditions.push(eq(invoices.paymentStatus, input.paymentStatus));
        }
        
        if (input.projectId !== undefined) {
          if (input.projectId === null) {
            conditions.push(eq(invoices.projectId, null));
          } else {
            conditions.push(eq(invoices.projectId, input.projectId));
          }
        }
        
        if (input.month) {
          conditions.push(eq(invoices.month, input.month));
        }
        
        if (input.dateFrom) {
          conditions.push(gte(invoices.invoiceDate, input.dateFrom));
        }
        
        if (input.dateTo) {
          conditions.push(lte(invoices.invoiceDate, input.dateTo));
        }
        
        if (input.amountMin !== undefined) {
          conditions.push(gte(invoices.amount, input.amountMin));
        }
        
        if (input.amountMax !== undefined) {
          conditions.push(lte(invoices.amount, input.amountMax));
        }
        
        if (input.currency) {
          conditions.push(eq(invoices.currency, input.currency));
        }
        
        const results = await db.select()
          .from(invoices)
          .where(and(...conditions))
          .orderBy(desc(invoices.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        // Get total count
        const totalResult = await db.select()
          .from(invoices)
          .where(and(...conditions));
        
        return { results, total: totalResult.length };
      }),

    // Bulk operations
    bulkDelete: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const count = await bulkDeleteInvoices(input.ids, ctx.user.id);
        return { success: true, count };
      }),

    bulkUpdate: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1),
        updates: z.object({
          projectId: z.number().optional().nullable(),
          paymentStatus: z.enum(["pending", "paid", "overdue"]).optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = {};
        if (input.updates.projectId !== undefined) updateData.projectId = input.updates.projectId;
        if (input.updates.paymentStatus !== undefined) {
          updateData.paymentStatus = input.updates.paymentStatus;
          if (input.updates.paymentStatus === "paid") {
            updateData.paidAt = new Date();
          } else {
            updateData.paidAt = null;
          }
        }
        if (input.updates.notes !== undefined) updateData.notes = input.updates.notes;
        
        const count = await bulkUpdateInvoices(input.ids, ctx.user.id, updateData);
        return { success: true, count };
      }),

    bulkAssignToProject: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1),
        projectId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const count = await bulkAssignToProject(input.ids, ctx.user.id, input.projectId);
        return { success: true, count };
      }),

    bulkMarkAsPaid: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1),
        isPaid: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const count = await bulkMarkAsPaid(input.ids, ctx.user.id, input.isPaid);
        return { success: true, count };
      }),

    // Update invoice
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          toolName: z.string().optional(),
          companyName: z.string().optional(),
          notes: z.string().optional(),
          dueDate: z.date().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const invoice = await db.select().from(invoices).where(eq(invoices.id, input.id)).limit(1);
        if (invoice.length === 0 || invoice[0].userId !== ctx.user.id) {
          throw new Error("Invoice not found or unauthorized");
        }

        const updateData: Record<string, unknown> = {};
        if (input.toolName !== undefined) updateData.toolName = input.toolName;
        if (input.companyName !== undefined) updateData.companyName = input.companyName;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;

        await db.update(invoices).set(updateData).where(eq(invoices.id, input.id));

        return { success: true };
      }),

    // Mark as paid/unpaid
    togglePaid: protectedProcedure
      .input(z.object({
        id: z.number(),
        isPaid: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const invoice = await db.select().from(invoices).where(eq(invoices.id, input.id)).limit(1);
        if (invoice.length === 0 || invoice[0].userId !== ctx.user.id) {
          throw new Error("Invoice not found or unauthorized");
        }

        await db.update(invoices)
          .set({
            paymentStatus: input.isPaid ? "paid" : "pending",
            paidAt: input.isPaid ? new Date() : null,
          })
          .where(eq(invoices.id, input.id));

        return { success: true };
      }),

    // Get invoices by month
    byMonth: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return getInvoicesByMonth(ctx.user.id, input.month);
      }),

    // Get single invoice
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getInvoice(input.id, ctx.user.id);
      }),

    // Delete invoice
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteInvoice(input.id, ctx.user.id);
        return { success: true };
      }),

    // Download single invoice
    download: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await getInvoice(input.id, ctx.user.id);
        if (!invoice) {
          throw new Error("Rechnung nicht gefunden");
        }
        
        const { storageGetSignedUrl } = await import("./storage");
        const signedUrl = await storageGetSignedUrl(invoice.filePath, 3600); // 1 hour expiry
        return { url: signedUrl, fileName: invoice.fileName };
      }),

    // Download all invoices for a month as ZIP
    downloadAll: protectedProcedure
      .input(z.object({ 
        month: z.string(),
        invoiceIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoicesList = await getInvoicesByMonth(ctx.user.id, input.month);
        const invoicesToDownload = input.invoiceIds 
          ? invoicesList.filter(inv => input.invoiceIds!.includes(inv.id))
          : invoicesList;
        
        if (invoicesToDownload.length === 0) {
          throw new Error("Keine Rechnungen zum Herunterladen");
        }

        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        const { storageGetSignedUrl } = await import("./storage");

        for (const invoice of invoicesToDownload) {
          try {
            // Get signed URL for each invoice
            const signedUrl = await storageGetSignedUrl(invoice.filePath, 3600);
            const response = await fetch(signedUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const fileName = invoice.fileName || `rechnung_${invoice.id}.pdf`;
              zip.file(fileName, buffer);
            }
          } catch (error) {
            console.error(`Failed to fetch invoice ${invoice.id}:`, error);
          }
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
        const fileName = `Rechnungen_${input.month}.zip`;

        const { storagePut } = await import("./storage");
        const { url, path: filePath } = await storagePut(
          `exports/${ctx.user.id}/${fileName}`,
          zipBuffer,
          "application/zip"
        );

        // Save to export history
        await createExportHistory({
          userId: ctx.user.id,
          exportType: "zip",
          fileName,
          filePath,
          fileUrl: url,
          fileSize: zipBuffer.length,
          invoiceCount: invoicesToDownload.length,
          month: input.month,
          parameters: JSON.stringify({ invoiceIds: input.invoiceIds }),
        });

        return { url, fileName, count: invoicesToDownload.length };
      }),

    // Get monthly summary
    monthlySummary: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        const invoicesList = await getInvoicesByMonth(ctx.user.id, input.month);
        
        const totalUSD = invoicesList
          .filter(inv => inv.currency === "USD")
          .reduce((sum, inv) => sum + inv.amount, 0);
        
        const totalEUR = invoicesList
          .filter(inv => inv.currency === "EUR")
          .reduce((sum, inv) => sum + inv.amount, 0);
        
        const exchangeRate = 0.92;
        const totalInEUR = Math.round(totalUSD * exchangeRate) + totalEUR;
        
        // Count paid/unpaid
        const paidCount = invoicesList.filter(inv => inv.paymentStatus === "paid").length;
        const pendingCount = invoicesList.filter(inv => inv.paymentStatus === "pending").length;
        
        return {
          month: input.month,
          invoices: invoicesList,
          totalUSD,
          totalEUR,
          totalInEUR,
          exchangeRate,
          paidCount,
          pendingCount,
        };
      }),

    // Get recurring invoices
    recurring: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      const results = await db.select()
        .from(invoices)
        .where(and(
          eq(invoices.userId, ctx.user.id),
          eq(invoices.isRecurring, true)
        ))
        .orderBy(desc(invoices.createdAt));
      
      // Group by recurringGroupId
      const groups: Record<string, typeof results> = {};
      for (const inv of results) {
        const groupId = inv.recurringGroupId || 'unknown';
        if (!groups[groupId]) groups[groupId] = [];
        groups[groupId].push(inv);
      }
      
      return Object.entries(groups).map(([groupId, invoicesList]) => ({
        groupId,
        toolName: invoicesList[0]?.toolName || 'Unknown',
        companyName: invoicesList[0]?.companyName || 'Unknown',
        invoices: invoicesList,
        totalAmount: invoicesList.reduce((sum, inv) => sum + inv.amount, 0),
        count: invoicesList.length,
      }));
    }),

    // Get duplicate invoices
    duplicates: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      const results = await db.select()
        .from(invoices)
        .where(and(
          eq(invoices.userId, ctx.user.id),
          eq(invoices.isDuplicate, true)
        ))
        .orderBy(desc(invoices.createdAt));
      
      return results;
    }),

    // Assign invoice to project
    assignProject: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        projectId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateInvoice(input.invoiceId, {
          projectId: input.projectId,
        });
        return { success: true };
      }),

    // Export to Excel
    exportExcel: protectedProcedure
      .input(z.object({ 
        month: z.string(),
        exchangeRate: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoicesList = await getInvoicesByMonth(ctx.user.id, input.month);
        
        const totalUSD = invoicesList
          .filter(inv => inv.currency === "USD")
          .reduce((sum, inv) => sum + inv.amount, 0);
        
        const totalEUR = invoicesList
          .filter(inv => inv.currency === "EUR")
          .reduce((sum, inv) => sum + inv.amount, 0);
        
        const exchangeRate = input.exchangeRate || 0.92;
        const totalInEUR = Math.round(totalUSD * exchangeRate) + totalEUR;
        
        const summary = {
          month: input.month,
          invoices: invoicesList,
          totalUSD,
          totalEUR,
          totalInEUR,
        };
        
        const excelBuffer = await generateMonthlyExcel(summary, exchangeRate);
        
        const fileName = `Tool_Ausgaben_${input.month}.xlsx`;
        const { url, path: filePath } = await storagePut(
          `exports/${ctx.user.id}/${fileName}`,
          excelBuffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        
        // Save to export history
        await createExportHistory({
          userId: ctx.user.id,
          exportType: "excel",
          fileName,
          filePath,
          fileUrl: url,
          fileSize: excelBuffer.length,
          invoiceCount: invoicesList.length,
          month: input.month,
          parameters: JSON.stringify({ exchangeRate }),
        });
        
        return { url, fileName };
      }),

    // Export to DATEV format
    exportDatev: protectedProcedure
      .input(z.object({ 
        month: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoicesList = await getInvoicesByMonth(ctx.user.id, input.month);
        
        const csvBuffer = await generateDatevExport(invoicesList, input.month);
        
        const fileName = `DATEV_Export_${input.month}.csv`;
        const { url, path: filePath } = await storagePut(
          `exports/${ctx.user.id}/${fileName}`,
          csvBuffer,
          "text/csv"
        );
        
        // Save to export history
        await createExportHistory({
          userId: ctx.user.id,
          exportType: "datev",
          fileName,
          filePath,
          fileUrl: url,
          fileSize: csvBuffer.length,
          invoiceCount: invoicesList.length,
          month: input.month,
          parameters: JSON.stringify({}),
        });
        
        return { url, fileName };
      }),

    // Generate PDF Report
    exportPdf: protectedProcedure
      .input(z.object({ 
        month: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoicesList = await getInvoicesByMonth(ctx.user.id, input.month);
        const projects = await getUserProjects(ctx.user.id);
        
        const pdfBuffer = await generatePdfReport(invoicesList, projects, input.month);
        
        const fileName = `Report_${input.month}.pdf`;
        const { url, path: filePath } = await storagePut(
          `exports/${ctx.user.id}/${fileName}`,
          pdfBuffer,
          "application/pdf"
        );
        
        // Save to export history
        await createExportHistory({
          userId: ctx.user.id,
          exportType: "pdf",
          fileName,
          filePath,
          fileUrl: url,
          fileSize: pdfBuffer.length,
          invoiceCount: invoicesList.length,
          month: input.month,
          parameters: JSON.stringify({}),
        });
        
        return { url, fileName };
      }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserProjects(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateProject(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProject(input.id, ctx.user.id);
        return { success: true };
      }),

    assignInvoice: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        projectId: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateInvoice(input.invoiceId, {
          projectId: input.projectId,
        });
        return { success: true };
      }),

    initializeDefaults: protectedProcedure
      .mutation(async ({ ctx }) => {
        await initializeDefaultProjects(ctx.user.id);
        return { success: true };
      }),

    // Download all invoices for a project as ZIP
    downloadAll: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get project info
        const project = await db.select()
          .from(projects)
          .where(and(
            eq(projects.id, input.projectId),
            eq(projects.userId, ctx.user.id)
          ))
          .limit(1);

        if (project.length === 0) {
          throw new Error("Projekt nicht gefunden");
        }

        // Get all invoices for this project
        const projectInvoices = await db.select()
          .from(invoices)
          .where(and(
            eq(invoices.userId, ctx.user.id),
            eq(invoices.projectId, input.projectId)
          ));

        if (projectInvoices.length === 0) {
          throw new Error("Keine Rechnungen in diesem Projekt");
        }

        // Create ZIP file
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();

        for (const invoice of projectInvoices) {
          try {
            const response = await fetch(invoice.fileUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const fileName = invoice.fileName || `rechnung_${invoice.id}.pdf`;
              zip.file(fileName, buffer);
            }
          } catch (error) {
            console.error(`Failed to fetch invoice ${invoice.id}:`, error);
          }
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
        const projectName = project[0].name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${projectName}_Rechnungen.zip`;

        const { url } = await storagePut(
          `exports/${ctx.user.id}/${fileName}`,
          zipBuffer,
          "application/zip"
        );

        return { url, fileName, count: projectInvoices.length };
      }),
  }),

  teams: router({
    // List user's teams
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      const memberOf = await db.select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, ctx.user.id));
      
      const teamIds = memberOf.map(m => m.teamId);
      if (teamIds.length === 0) return [];
      
      const teamsList = await db.select()
        .from(teams)
        .where(or(...teamIds.map(id => eq(teams.id, id))));
      
      return teamsList.map(team => ({
        ...team,
        role: memberOf.find(m => m.teamId === team.id)?.role || 'member',
      }));
    }),

    // Create team
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [team] = await db.insert(teams)
          .values({
            name: input.name,
            ownerId: ctx.user.id,
          })
          .returning();
        
        // Add owner as team member
        await db.insert(teamMembers)
          .values({
            teamId: team.id,
            userId: ctx.user.id,
            role: 'owner',
            acceptedAt: new Date(),
          });
        
        return team;
      }),

    // Invite member
    invite: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        email: z.string().email(),
        role: z.enum(['admin', 'member', 'viewer']).optional().default('member'),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user is admin/owner of team
        const membership = await db.select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
          throw new Error("Nicht berechtigt, Mitglieder einzuladen");
        }
        
        // Generate invite token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        const [invitation] = await db.insert(teamInvitations)
          .values({
            teamId: input.teamId,
            email: input.email,
            role: input.role,
            token,
            invitedBy: ctx.user.id,
            expiresAt,
          })
          .returning();
        
        // TODO: Send invitation email
        
        return { 
          success: true, 
          inviteLink: `/team/join/${token}`,
          expiresAt,
        };
      }),

    // Accept invitation
    acceptInvite: protectedProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [invitation] = await db.select()
          .from(teamInvitations)
          .where(eq(teamInvitations.token, input.token))
          .limit(1);
        
        if (!invitation) {
          throw new Error("Einladung nicht gefunden");
        }
        
        if (new Date() > invitation.expiresAt) {
          throw new Error("Einladung ist abgelaufen");
        }
        
        // Add user to team
        await db.insert(teamMembers)
          .values({
            teamId: invitation.teamId,
            userId: ctx.user.id,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
            acceptedAt: new Date(),
          });
        
        // Delete invitation
        await db.delete(teamInvitations)
          .where(eq(teamInvitations.id, invitation.id));
        
        return { success: true, teamId: invitation.teamId };
      }),

    // Get team members
    members: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        
        // Verify user is member of team
        const membership = await db.select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          throw new Error("Nicht berechtigt");
        }
        
        return db.select()
          .from(teamMembers)
          .where(eq(teamMembers.teamId, input.teamId));
      }),

    // Remove member
    removeMember: protectedProcedure
      .input(z.object({
        teamId: z.number(),
        userId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify user is admin/owner
        const membership = await db.select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, ctx.user.id)
          ))
          .limit(1);
        
        if (membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
          throw new Error("Nicht berechtigt");
        }
        
        // Can't remove owner
        const targetMembership = await db.select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, input.userId)
          ))
          .limit(1);
        
        if (targetMembership[0]?.role === 'owner') {
          throw new Error("Owner kann nicht entfernt werden");
        }
        
        await db.delete(teamMembers)
          .where(and(
            eq(teamMembers.teamId, input.teamId),
            eq(teamMembers.userId, input.userId)
          ));
        
        return { success: true };
      }),
  }),

  // Settings router
  settings: router({
    // Get user settings
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getUserSettings(ctx.user.id);
      if (!settings) {
        // Create default settings
        const defaultSettings = await upsertUserSettings({
          userId: ctx.user.id,
          defaultExchangeRate: "1.0",
          defaultExportFormat: "excel",
          emailNotifications: true,
        });
        return defaultSettings;
      }
      return settings;
    }),

    // Update user settings
    update: protectedProcedure
      .input(z.object({
        defaultExchangeRate: z.string().optional(),
        defaultExportFormat: z.enum(["excel", "datev", "pdf"]).optional(),
        emailNotifications: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const currentSettings = await getUserSettings(ctx.user.id);
        const updateData: any = {
          userId: ctx.user.id,
        };
        
        if (input.defaultExchangeRate !== undefined) {
          updateData.defaultExchangeRate = input.defaultExchangeRate;
        } else if (currentSettings) {
          updateData.defaultExchangeRate = currentSettings.defaultExchangeRate;
        } else {
          updateData.defaultExchangeRate = "1.0";
        }
        
        if (input.defaultExportFormat !== undefined) {
          updateData.defaultExportFormat = input.defaultExportFormat;
        } else if (currentSettings) {
          updateData.defaultExportFormat = currentSettings.defaultExportFormat;
        } else {
          updateData.defaultExportFormat = "excel";
        }
        
        if (input.emailNotifications !== undefined) {
          updateData.emailNotifications = input.emailNotifications;
        } else if (currentSettings) {
          updateData.emailNotifications = currentSettings.emailNotifications;
        } else {
          updateData.emailNotifications = true;
        }
        
        return await upsertUserSettings(updateData);
      }),

    // Update user profile
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { upsertUser } = await import("./db");
        const currentUser = await getUser(ctx.user.id);
        if (!currentUser) throw new Error("User not found");
        
        const updatedName = input.name ?? currentUser.name;
        
        // Update in database
        const updated = await upsertUser({
          id: ctx.user.id,
          email: currentUser.email,
          name: updatedName,
          role: currentUser.role,
        });
        
        // Also update in Supabase Auth user metadata
        try {
          const { supabaseAdmin } = await import("./supabase");
          const { error: updateError } = await (supabaseAdmin.auth as any).admin.updateUserById(ctx.user.id, {
            user_metadata: {
              name: updatedName,
            },
          });
          if (updateError) {
            console.error("[Profile] Failed to update Supabase user metadata:", updateError);
          }
        } catch (error) {
          console.error("[Profile] Failed to update Supabase user metadata:", error);
          // Don't fail the request if Supabase update fails, database update is more important
        }
        
        return updated;
      }),
  }),

  // Export History router
  exportHistory: router({
    // List export history
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return await getUserExportHistory(ctx.user.id, input.limit);
      }),

    // Get single export
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getExportHistory(input.id, ctx.user.id);
      }),

    // Download export
    download: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const exportRecord = await getExportHistory(input.id, ctx.user.id);
        if (!exportRecord) {
          throw new Error("Export nicht gefunden");
        }
        
        const { storageGetSignedUrl } = await import("./storage");
        const signedUrl = await storageGetSignedUrl(exportRecord.filePath, 3600);
        return { url: signedUrl, fileName: exportRecord.fileName };
      }),

    // Delete export
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteExportHistory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
