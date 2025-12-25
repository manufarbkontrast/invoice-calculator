import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Receipt, ArrowRight, Upload, FileSpreadsheet, CreditCard, FileText, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";

const neonBlue = "#3b82f6";
const neonPurple = "#a855f7";
const darkBg = "#0a0a0f";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: darkBg }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xl text-gray-400">Lädt...</span>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: darkBg }}>
      {/* Animated Background Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-20"
          animate={{
            background: [
              `radial-gradient(circle at 20% 30%, ${neonBlue} 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 70%, ${neonPurple} 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 30%, ${neonBlue} 0%, transparent 50%)`,
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: `radial-gradient(circle, ${neonBlue} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{
            background: `radial-gradient(circle, ${neonPurple} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${neonBlue} 0%, ${neonPurple} 100%)`,
                boxShadow: `0 0 20px ${neonBlue}40`,
              }}
            >
              <Receipt className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-semibold text-white">{APP_TITLE}</span>
          </motion.div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#products" className="text-white/80 hover:text-white transition-colors text-sm font-medium border-b-2 border-white pb-1">Products</a>
              <a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm font-medium">Pricing</a>
              <a href="#about" className="text-white/60 hover:text-white transition-colors text-sm font-medium">About</a>
              <a href="#contact" className="text-white/60 hover:text-white transition-colors text-sm font-medium">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setLocation("/auth")}
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Log In
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => setLocation("/auth")}
                  className="rounded-lg px-6 h-10 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                >
                  Jetzt Calculator
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div 
                className="rounded-2xl p-8 backdrop-blur-xl border border-white/10"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                  boxShadow: `0 8px 32px rgba(59, 130, 246, 0.2)`,
                }}
              >
                {/* Funnel Visual */}
                <div className="relative h-96 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    {/* Funnel */}
                    <path
                      d="M200 50 L350 200 L300 350 L100 350 L50 200 Z"
                      fill="url(#funnelGradient)"
                      opacity="0.3"
                    />
                    <defs>
                      <linearGradient id="funnelGradient" x1="200" y1="50" x2="200" y2="350">
                        <stop offset="0%" stopColor={neonBlue} />
                        <stop offset="100%" stopColor={neonPurple} />
                      </linearGradient>
                    </defs>
                    
                    {/* Credit Card */}
                    <motion.g
                      initial={{ y: 0 }}
                      animate={{ y: [0, 80, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <rect x="150" y="100" width="100" height="60" rx="8" fill="#1a1a2e" stroke={neonBlue} strokeWidth="2" />
                      <rect x="160" y="120" width="20" height="15" rx="2" fill="#FFD700" />
                      <text x="190" y="145" fill="white" fontSize="10" fontFamily="monospace">****</text>
                    </motion.g>
                    
                    {/* PDF Document */}
                    <motion.g
                      initial={{ y: 0 }}
                      animate={{ y: [0, 100, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    >
                      <rect x="180" y="50" width="60" height="80" rx="4" fill="#dc2626" />
                      <text x="195" y="75" fill="white" fontSize="12" fontFamily="monospace" fontWeight="bold">PDF</text>
                      <line x1="190" y1="90" x2="230" y2="90" stroke="white" strokeWidth="1" />
                      <line x1="190" y1="100" x2="230" y2="100" stroke="white" strokeWidth="1" />
                      <line x1="190" y1="110" x2="220" y2="110" stroke="white" strokeWidth="1" />
                    </motion.g>
                    
                    {/* Particles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.circle
                        key={i}
                        cx={200 + Math.cos(i * 45 * Math.PI / 180) * 100}
                        cy={200 + Math.sin(i * 45 * Math.PI / 180) * 100}
                        r="3"
                        fill={neonBlue}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-5xl md:text-6xl font-bold leading-tight text-white"
              >
                Rechnungen verwalten.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Ohne Aufwand.
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl"
              >
                Laden Sie PDF-Rechnungen hoch und erhalten Sie automatisch eine übersichtliche Kalkulation. 
                Exportieren Sie monatliche Zusammenfassungen als Excel-Datei.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => setLocation("/auth")}
                    size="lg" 
                    className="rounded-lg px-8 h-14 text-base font-semibold text-white bg-gray-800/50 hover:bg-gray-700/50 border border-white/20 backdrop-blur-sm"
                  >
                    <span className="flex items-center gap-2">
                      Jetzt kostenlos starten
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Data Extraction */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card 
                className="rounded-2xl h-full border border-white/10 overflow-hidden backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                }}
              >
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-4 text-white">Data extraction</h3>
                  <div className="space-y-2 mb-6 font-mono text-sm">
                    <div className="flex gap-4">
                      <span className="text-white/60">91.26</span>
                      <span className="text-blue-400">7968</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-white/60">9026</span>
                      <span className="text-purple-400">12637</span>
                      <span className="text-white/60">8739</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-blue-400">12079</span>
                      <span className="text-white/60">7858</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-purple-400">8,436</span>
                      <span className="text-white/60">12730</span>
                      <span className="text-blue-400">7020</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-white/60">9,058</span>
                      <span className="text-purple-400">12223</span>
                      <span className="text-white/60">7666</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-blue-400">13122</span>
                      <span className="text-white/60">12808</span>
                      <span className="text-purple-400">7733</span>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Automatische Datenextraktion und intelligente Verarbeitung. Exportieren Sie Ihre Daten nahtlos.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Einfacher Upload - Highlighted */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card 
                className="rounded-2xl h-full border-2 overflow-hidden backdrop-blur-xl relative"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
                  borderColor: neonBlue,
                  boxShadow: `0 0 30px ${neonBlue}40`,
                }}
              >
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-4 text-white">Einfacher Upload</h3>
                  <div 
                    className="mb-6 rounded-xl border-2 border-dashed p-12 flex flex-col items-center justify-center"
                    style={{
                      borderColor: neonBlue,
                      background: "rgba(59, 130, 246, 0.05)",
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Upload className="h-12 w-12 mb-3" style={{ color: neonBlue }} strokeWidth={1.5} />
                    </motion.div>
                    <p className="text-white/60 text-sm text-center">Drag & Drop oder klicken</p>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Einfacher Upload mit Drag & Drop. Laden Sie Ihre Rechnungen mühelos hoch.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Excel Export */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card 
                className="rounded-2xl h-full border border-white/10 overflow-hidden backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                }}
              >
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-4 text-white">Excel-Export</h3>
                  <div className="mb-6 flex items-center justify-center">
                    <div className="relative">
                      <FileSpreadsheet 
                        className="h-20 w-20" 
                        style={{ color: "#FFD700" }} 
                        strokeWidth={1.5}
                      />
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="h-6 w-6" style={{ color: neonBlue }} />
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-2 -left-2"
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <Sparkles className="h-6 w-6" style={{ color: neonPurple }} />
                      </motion.div>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Nahtloser Export in Excel-Format. Professionelle Formatierung für Ihre Buchhaltung.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${neonBlue} 0%, ${neonPurple} 100%)`,
              }}
            >
              <Receipt className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-semibold text-white">{APP_TITLE}</span>
          </div>
          <p className="text-white/40 text-sm">© 2025 {APP_TITLE}. Automatische Rechnungsverarbeitung mit KI.</p>
        </div>
      </footer>
    </div>
  );
}
