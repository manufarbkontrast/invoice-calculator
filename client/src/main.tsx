import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Keine automatischen Retries
      refetchOnWindowFocus: false, // Kein Refetch beim Fokus
      refetchOnReconnect: false, // Kein Refetch bei Reconnect
      refetchOnMount: false, // Kein Refetch beim Mount
      refetchInterval: false, // Kein automatisches Refetch-Interval
      staleTime: 1000 * 60 * 10, // Daten 10 Minuten als "fresh" betrachten
      gcTime: 1000 * 60 * 30, // Cache 30 Minuten behalten
    },
    mutations: {
      retry: false,
    },
  },
});

// Disabled query cache subscribers to prevent constant re-renders
// Authentication redirects are handled in component useEffect hooks
// const redirectToLoginIfUnauthorized = (error: unknown) => {
//   if (!(error instanceof TRPCClientError)) return;
//   if (typeof window === "undefined") return;
//
//   const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
//
//   if (!isUnauthorized) return;
//
//   window.location.href = "/auth";
// };
//
// queryClient.getQueryCache().subscribe(event => {
//   if (event.type === "updated" && event.action.type === "error") {
//     const error = event.query.state.error;
//     redirectToLoginIfUnauthorized(error);
//   }
// });
//
// queryClient.getMutationCache().subscribe(event => {
//   if (event.type === "updated" && event.action.type === "error") {
//     const error = event.mutation.state.error;
//     redirectToLoginIfUnauthorized(error);
//   }
// });

// Cache session token to avoid constant calls
let cachedSession: { token: string; expiresAt: number } | null = null;

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: async () => {
        try {
          // Use cached session if still valid (with 30s buffer)
          if (cachedSession && cachedSession.expiresAt > Date.now() + 30000) {
            return {
              Authorization: `Bearer ${cachedSession.token}`,
            };
          }

          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.access_token) {
            // Cache the session with expiry time (default 1 hour)
            const expiresAt = (session.expires_at || Date.now() + 3600000) * 1000;
            cachedSession = {
              token: session.access_token,
              expiresAt,
            };
            
            return {
              Authorization: `Bearer ${session.access_token}`,
            };
          } else {
            cachedSession = null;
          }
        } catch (error) {
          console.error("[tRPC] Failed to get session:", error);
          cachedSession = null;
        }
        
        return {};
      },
      fetch: async (url, options) => {
        const response = await fetch(url, options);
        
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Server returned non-JSON response (${response.status} ${response.statusText}): ${text.substring(0, 100)}`
          );
        }
        
        return response;
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
