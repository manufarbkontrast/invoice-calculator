import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { createProject, getUserProjects, updateInvoice, deleteProject } from "./db";

export const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserProjects(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createProject({
        userId: ctx.user.id,
        name: input.name,
        color: input.color || "#3b82f6",
      });
    }),

  assignInvoice: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        projectId: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateInvoice(input.invoiceId, { projectId: input.projectId });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return deleteProject(input.id, ctx.user.id);
    }),
});

