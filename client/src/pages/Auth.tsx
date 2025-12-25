import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Receipt, ArrowLeft, Mail, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { theme } from "@/theme";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Auth() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setLocation("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xl text-gray-600">Lädt...</span>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: theme.colors.bgGradient }}>
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(${theme.colors.blue} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.colors.blue} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Animated Background Blobs */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{
          background: `radial-gradient(circle, ${theme.colors.blue} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{
          background: `radial-gradient(circle, ${theme.colors.lightBlue} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 z-10"
      >
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-gray-700 hover:text-blue-600 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Startseite
        </Button>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="w-full max-w-md px-6 relative z-10"
      >
        <Card className="rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                  boxShadow: theme.shadows.md,
                }}
              >
                <Receipt className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{APP_TITLE}</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isSignUp ? "Konto erstellen" : "Willkommen zurück"}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {isSignUp 
                ? "Erstellen Sie ein neues Konto, um zu beginnen" 
                : "Melden Sie sich an, um fortzufahren"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  E-Mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 border-blue-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Passwort
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 border-blue-200 focus:border-blue-500 rounded-lg"
                  />
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.lg,
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {isSignUp ? "Wird erstellt..." : "Wird angemeldet..."}
                    </>
                  ) : (
                    isSignUp ? "Registrieren" : "Anmelden"
                  )}
                </Button>
              </motion.div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {isSignUp ? (
                    <>Bereits ein Konto? <span className="font-semibold">Anmelden</span></>
                  ) : (
                    <>Noch kein Konto? <span className="font-semibold">Registrieren</span></>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
