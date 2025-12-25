import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Receipt, ArrowRight, Upload, FileSpreadsheet, Shield, Clock, Zap, BarChart3, Cloud } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const neonBlue = "#3b82f6";
const neonPurple = "#a855f7";
const darkBg = "#0a0a0f";

// Stagger animation variants from Context7
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setLocation("/auth")}
              className="rounded-lg px-6 h-10 text-sm font-medium text-white"
              style={{
                background: neonBlue,
                boxShadow: `0 4px 14px ${neonBlue}40`,
              }}
            >
              Anmelden
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center space-y-8"
          >
            {/* Badge */}
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30 bg-blue-500/10 text-blue-300 backdrop-blur-sm"
            >
              <Zap className="h-4 w-4" />
              <span>Automatische Rechnungsverarbeitung</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="text-5xl md:text-7xl font-bold leading-tight text-white"
            >
              Rechnungen verwalten.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Ohne Aufwand.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={item}
              className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto"
            >
              Laden Sie PDF-Rechnungen hoch und erhalten Sie automatisch eine übersichtliche Kalkulation. 
              Exportieren Sie monatliche Zusammenfassungen als Excel-Datei.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              variants={item}
              className="pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => setLocation("/auth")}
                  size="lg" 
                  className="rounded-lg px-8 h-14 text-base font-semibold text-white"
                  style={{
                    background: neonBlue,
                    boxShadow: `0 8px 24px ${neonBlue}40`,
                  }}
                >
                  <span className="flex items-center gap-2">
                    Jetzt kostenlos starten
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* 3D Funnel Visual - Centered */}
            <motion.div
              variants={item}
              className="flex justify-center pt-12"
            >
              <div 
                className="rounded-2xl p-8 backdrop-blur-xl border border-white/10 relative"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
                  boxShadow: `0 8px 32px rgba(59, 130, 246, 0.2)`,
                }}
              >
                <div className="relative w-80 h-80 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    {/* Funnel */}
                    <motion.path
                      d="M200 50 L350 200 L300 350 L100 350 L50 200 Z"
                      fill="url(#funnelGradient)"
                      opacity="0.3"
                      animate={{
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <defs>
                      <linearGradient id="funnelGradient" x1="200" y1="50" x2="200" y2="350">
                        <stop offset="0%" stopColor={neonBlue} />
                        <stop offset="100%" stopColor={neonPurple} />
                      </linearGradient>
                    </defs>
                    
                    {/* Credit Card */}
                    <motion.g
                      initial={{ y: 0, opacity: 0 }}
                      animate={{ 
                        y: [0, 80, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    >
                      <rect x="150" y="100" width="100" height="60" rx="8" fill="#1a1a2e" stroke={neonBlue} strokeWidth="2" />
                      <rect x="160" y="120" width="20" height="15" rx="2" fill="#FFD700" />
                      <text x="190" y="145" fill="white" fontSize="10" fontFamily="monospace">****</text>
                    </motion.g>
                    
                    {/* PDF Document */}
                    <motion.g
                      initial={{ y: 0, opacity: 0 }}
                      animate={{ 
                        y: [0, 100, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        ease: "easeInOut", 
                        delay: 0.8 
                      }}
                    >
                      <rect x="180" y="50" width="60" height="80" rx="4" fill="#dc2626" />
                      <text x="195" y="75" fill="white" fontSize="12" fontFamily="monospace" fontWeight="bold">PDF</text>
                      <line x1="190" y1="90" x2="230" y2="90" stroke="white" strokeWidth="1" />
                      <line x1="190" y1="100" x2="230" y2="100" stroke="white" strokeWidth="1" />
                      <line x1="190" y1="110" x2="220" y2="110" stroke="white" strokeWidth="1" />
                    </motion.g>
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={item}
              className="flex flex-wrap items-center justify-center gap-8 pt-8"
            >
              {[
                { icon: Shield, text: "Sicher & Verschlüsselt" },
                { icon: Clock, text: "Sofortige Verarbeitung" },
                { icon: Zap, text: "KI-Extraktion" }
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    border: `1px solid ${neonBlue}30`,
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <badge.icon className="h-5 w-5" style={{ color: neonBlue }} />
                  <span className="text-sm font-medium text-white/80">{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              Alles was Sie brauchen
            </h2>
            <p className="text-lg text-white/60">
              Leistungsstarke Funktionen für Ihre Rechnungsverwaltung
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Top-Left: Data Extraction with glowing numbers */}
            <motion.div
              variants={item}
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
                  <div className="space-y-3 mb-6 font-mono text-lg">
                    {[
                      { values: ["24.99", "6.77"], colors: ["text-yellow-400", "text-blue-400"] },
                      { values: ["91.26", "7968"], colors: ["text-white/60", "text-blue-400"] },
                      { values: ["9026", "12637", "8739"], colors: ["text-white/60", "text-purple-400", "text-white/60"] },
                      { values: ["12079", "7858"], colors: ["text-blue-400", "text-white/60"] },
                    ].map((row, i) => (
                      <motion.div
                        key={i}
                        className="flex gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        {row.values.map((val, j) => (
                          <span key={j} className={row.colors[j] || "text-white/60"}>
                            {val}
                          </span>
                        ))}
                      </motion.div>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Data extraction</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Automatische Datenextraktion und intelligente Verarbeitung. Exportieren Sie Ihre Daten nahtlos.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top-Right: Drag & Drop with pulsing border */}
            <motion.div
              variants={item}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card 
                className="rounded-2xl h-full border-2 overflow-hidden backdrop-blur-xl relative"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
                  borderColor: neonBlue,
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    border: `2px solid ${neonBlue}`,
                    boxShadow: `0 0 20px ${neonBlue}40`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 20px ${neonBlue}40`,
                      `0 0 40px ${neonBlue}60`,
                      `0 0 20px ${neonBlue}40`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <CardContent className="p-8 relative z-10">
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
                    <p className="text-white/80 text-sm text-center font-medium">Drag & Drop</p>
                    <p className="text-white/40 text-xs text-center mt-1">Pulsing Border Beam</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bottom-Left: Einfacher Upload */}
            <motion.div
              variants={item}
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
                  <div className="mb-6 flex items-center justify-center">
                    <Cloud className="h-16 w-16" style={{ color: neonBlue }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Einfacher Upload</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Ziehen Sie PDF-Rechnungen einfach per Drag & Drop in die Anwendung oder wählen Sie Dateien aus. Die KI erkennt automatisch alle wichtigen Informationen.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bottom-Right: Excel-Export */}
            <motion.div
              variants={item}
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
                  <div className="mb-6 flex items-center justify-center">
                    <BarChart3 className="h-16 w-16" style={{ color: "#FFD700" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Excel-Export</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Alle Rechnungen werden automatisch nach Monaten gruppiert. Sehen Sie auf einen Blick, wie viel Sie in jedem Monat ausgegeben haben.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-12 text-center"
            style={{
              background: neonBlue,
              boxShadow: `0 8px 32px ${neonBlue}40`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Bereit durchzustarten?
            </h2>
            <p className="text-lg mb-8 text-blue-100 max-w-xl mx-auto">
              Starten Sie jetzt und sparen Sie Zeit bei der Verwaltung Ihrer Tool-Ausgaben. 
              Kostenlos und ohne Kreditkarte.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => setLocation("/auth")}
                size="lg" 
                className="rounded-lg px-8 h-12 text-base font-semibold bg-white text-blue-600 hover:bg-gray-50 shadow-lg"
              >
                Kostenlos registrieren
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${neonBlue} 0%, ${neonPurple} 100%)`,
              }}
            >
              <Receipt className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg font-semibold text-white">{APP_TITLE}</span>
          </div>
          <p className="text-white/40 text-sm">© 2025 {APP_TITLE}. Automatische Rechnungsverarbeitung.</p>
        </div>
      </footer>
    </div>
  );
}
