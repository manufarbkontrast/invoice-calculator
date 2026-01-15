import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/const";
import { Receipt, Loader2, Eye, EyeOff, ArrowLeft, Sparkles, FileText, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "login" | "register";

export default function Auth() {
  const { isAuthenticated, loading, signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-xl text-black/50">Lädt...</span>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Erfolgreich angemeldet!");
        setLocation("/dashboard");
      } else {
        await signUp(email, password, name);
        toast.success("Konto erstellt! Sie können sich jetzt anmelden.");
        setMode("login");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 right-20 w-96 h-96 border border-white rounded-full" />
          <div className="absolute bottom-40 left-10 w-64 h-64 border border-white rounded-full" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 border border-white rounded-full" />
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
              <Receipt className="h-7 w-7 text-black" strokeWidth={1.5} />
            </div>
            <span className="text-3xl font-medium text-white tracking-tight">{APP_TITLE}</span>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <h2 className="text-5xl xl:text-6xl font-light text-white leading-tight mb-8">
            Verwalten Sie Ihre<br />Rechnungen<br />
            <span className="font-medium">intelligent.</span>
          </h2>
          <p className="text-xl text-white/50 leading-relaxed max-w-lg">
            Automatische Extraktion, monatliche Übersichten und professionelle Excel-Exporte. 
            Alles an einem Ort.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 grid grid-cols-3 gap-6"
        >
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-medium text-white mb-1">KI</p>
            <p className="text-white/40">Extraktion</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-medium text-white mb-1">PDF</p>
            <p className="text-white/40">Upload</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-medium text-white mb-1">Live</p>
            <p className="text-white/40">Analyse</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-2xl font-medium text-black tracking-tight">{APP_TITLE}</span>
          </div>

          {/* Back Link */}
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-black/40 hover:text-black transition-colors mb-10"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-base">Zurück zur Startseite</span>
          </button>

          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-4xl md:text-5xl font-light text-black mb-4">
                    {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
                  </h1>
                  <p className="text-xl text-black/40 mb-12">
                    {mode === "login" 
                      ? "Melden Sie sich an, um fortzufahren" 
                      : "Registrieren Sie sich kostenlos"}
                  </p>
                </motion.div>
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <Label htmlFor="name" className="text-base text-black/60">
                        Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ihr Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-16 rounded-2xl border-black/10 focus:border-black text-lg bg-white px-5"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base text-black/60">
                    E-Mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-16 rounded-2xl border-black/10 focus:border-black text-lg bg-white px-5"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-base text-black/60">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-16 rounded-2xl border-black/10 focus:border-black text-lg bg-white px-5 pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-6 w-6" />
                      ) : (
                        <Eye className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-black/90 text-white h-16 rounded-2xl text-lg font-medium mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : mode === "login" ? (
                    "Anmelden"
                  ) : (
                    "Registrieren"
                  )}
                </Button>
              </form>

              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-lg text-black/40 hover:text-black transition-colors"
                >
                  {mode === "login" ? (
                    <>Noch kein Konto? <span className="text-black font-medium underline underline-offset-4">Registrieren</span></>
                  ) : (
                    <>Bereits ein Konto? <span className="text-black font-medium underline underline-offset-4">Anmelden</span></>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
