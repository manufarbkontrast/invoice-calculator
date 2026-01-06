import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { supabaseAdmin } from "../supabase";
import { getUser, upsertUser, initializeDefaultProjects } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = (opts.req as any).headers?.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify the JWT token with Supabase (only if configured)
      if (!supabaseAdmin) {
        console.warn("[Auth] Supabase Admin nicht konfiguriert. Überspringe Token-Verification.");
        return { req: opts.req, res: opts.res, user: null };
      }

      const supabaseAuth = supabaseAdmin.auth as any;
      const { data: { user: supabaseUser }, error } = await supabaseAuth.getUser(token);
      
      if (error || !supabaseUser) {
        return { req: opts.req, res: opts.res, user: null };
      }
      
      // Try to get user from database
      user = (await getUser(supabaseUser.id)) || null;
      
      // If user doesn't exist, create them
      if (!user && supabaseUser.email) {
        console.log("[Auth] Creating new user:", supabaseUser.id);
        
        user = await upsertUser({
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
          role: 'user',
        }) || null;
        
        // Initialize default projects for new users
        if (user) {
          try {
            await initializeDefaultProjects(user.id);
            console.log("[Auth] Default projects created for user:", user.id);
          } catch (projectError) {
            console.error("[Auth] Failed to initialize default projects:", projectError);
          }
        }
      }
    }
  } catch (error) {
    console.error("[Auth] Authentication error:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
