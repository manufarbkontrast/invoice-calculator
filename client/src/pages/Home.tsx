import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Receipt, ArrowRight, TrendingUp, FileSpreadsheet, Lightbulb, Shield, FileText, BarChart3, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { theme } from "@/theme";

const { lightBlue, blue, darkBlue, bgGradient } = theme.colors;




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

// Falling animation for documents - will be used directly in motion.g

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { scrollYProgress } = useScroll();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

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
    <div className="min-h-screen relative overflow-hidden" style={{ background: theme.colors.bgGradient }}>
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

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-sm"
      >
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                boxShadow: `0 4px 12px ${theme.colors.blue}30`,
              }}
            >
              <Receipt className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-semibold text-gray-900">{APP_TITLE}</span>
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Features</a>
            <a href="#modules" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">KI-Module</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Preise</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Kontakt</a>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              <motion.h1
                variants={item}
                className="text-5xl md:text-6xl font-bold leading-tight text-gray-900"
              >
                Rechnungen verwalten.
                <br />
                <span className="text-blue-600">KI-gestützt.</span>
                <br />
                <span className="text-gray-700">Mühelos.</span>
              </motion.h1>

              <motion.p
                variants={item}
                className="text-lg md:text-xl text-gray-600 leading-relaxed"
              >
                Automatische Rechnungsverarbeitung mit künstlicher Intelligenz. 
                Sparen Sie Zeit und behalten Sie den Überblick.
              </motion.p>

              <motion.div
                variants={item}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => setLocation("/auth")}
                    size="lg" 
                    className="rounded-lg px-8 h-14 text-base font-semibold text-white shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                      boxShadow: `0 8px 24px ${theme.colors.blue}30`,
                    }}
                  >
                    Jetzt KI erleben
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Side - 3D Funnel Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-96 flex items-center justify-center overflow-hidden"
            >
              <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
                    {/* Funnel */}
                    <motion.path
                      d="M200 50 L350 200 L300 350 L100 350 L50 200 Z"
                      fill="url(#funnelGradient)"
                      opacity="0.4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5 }}
                    />
                    <defs>
                      <linearGradient id="funnelGradient" x1="200" y1="50" x2="200" y2="350">
                        <stop offset="0%" stopColor={blue} />
                        <stop offset="100%" stopColor={darkBlue} />
                      </linearGradient>
                    </defs>
                    
                    {/* Falling Documents */}
                    {[
                      { x: 150, delay: 0, type: "pdf" },
                      { x: 200, delay: 0.5, type: "doc" },
                      { x: 250, delay: 1, type: "sheet" },
                    ].map((doc, i) => (
                      <motion.g
                        key={i}
                        initial={{ y: -100, opacity: 0, rotate: 0 }}
                        animate={{
                          y: [0, 400],
                          opacity: [0, 1, 1, 0],
                          rotate: [0, Math.random() * 20 - 10],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          delay: doc.delay,
                          ease: "easeIn"
                        }}
                      >
                        {doc.type === "pdf" && (
                          <>
                            <rect x={doc.x} y="50" width="50" height="70" rx="4" fill="#dc2626" />
                            <text x={doc.x + 15} y="75" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold">PDF</text>
                            <line x1={doc.x + 10} y1="90" x2={doc.x + 40} y2="90" stroke="white" strokeWidth="1" />
                            <line x1={doc.x + 10} y1="100" x2={doc.x + 40} y2="100" stroke="white" strokeWidth="1" />
                          </>
                        )}
                        {doc.type === "doc" && (
                          <>
                            <rect x={doc.x} y="50" width="50" height="70" rx="4" fill="#3b82f6" />
                            <text x={doc.x + 10} y="75" fill="white" fontSize="10" fontFamily="monospace">DOC</text>
                            <line x1={doc.x + 10} y1="90" x2={doc.x + 40} y2="90" stroke="white" strokeWidth="1" />
                          </>
                        )}
                        {doc.type === "sheet" && (
                          <>
                            <rect x={doc.x} y="50" width="50" height="70" rx="4" fill="#10b981" />
                            <text x={doc.x + 5} y="75" fill="white" fontSize="10" fontFamily="monospace">XLS</text>
                            <line x1={doc.x + 10} y1="90" x2={doc.x + 40} y2="90" stroke="white" strokeWidth="1" />
                            <line x1={doc.x + 10} y1="100" x2={doc.x + 30} y2="100" stroke="white" strokeWidth="1" />
                          </>
                        )}
                      </motion.g>
                    ))}

                    {/* Glow Effect Below Funnel */}
                    <motion.g
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <circle cx="200" cy="380" r="40" fill={theme.colors.blue} opacity="0.2" />
                      <circle cx="200" cy="380" r="30" fill={theme.colors.blue} opacity="0.3" />
                      <circle cx="200" cy="380" r="20" fill={theme.colors.blue} opacity="0.4" />
                      
                      {/* X= Icon */}
                      <text x="185" y="385" fill={theme.colors.blue} fontSize="16" fontFamily="monospace" fontWeight="bold">X=</text>
                      
                      {/* Spreadsheet Icon */}
                      <rect x="210" y="370" width="20" height="20" rx="2" fill="#10b981" />
                      <line x1="213" y1="375" x2="227" y2="375" stroke="white" strokeWidth="1" />
                      <line x1="213" y1="380" x2="227" y2="380" stroke="white" strokeWidth="1" />
                    </motion.g>
                    </svg>
              </motion.div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Side - Feature Cards */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-8 text-gray-900"
              >
                Alles was Sie brauchen
              </motion.h2>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { icon: TrendingUp, title: "Datenautomatisierung", text: "Reibungslose Verarbeitung aller Rechnungen ohne manuellen Aufwand." },
                  { icon: BarChart3, title: "Monatliche Übersicht", text: "Automatische Gruppierung nach Monaten mit detaillierter Kostenanalyse." },
                  { icon: Lightbulb, title: "KI-gestützte Extraktion", text: "Dokumente hochladen, KI erkennt automatisch alle wichtigen Informationen." },
                  { icon: Sparkles, title: "Strukturierte Kalkulationen", text: "Klar strukturierte Auswertungen, die überzeugen und Zeit sparen." },
                  { icon: FileText, title: "Risikofreie Übersicht", text: "Vollständige Transparenz über alle Ausgaben und Rechnungen." },
                  { icon: Shield, title: "Sichere Datenverarbeitung", text: "Ihre Daten sind sicher verschlüsselt und geschützt." },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={item}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <Card 
                      className="rounded-xl h-full border border-blue-100 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                      style={{
                        borderColor: hoveredCard === index ? blue : undefined,
                        boxShadow: hoveredCard === index ? `0 8px 24px ${theme.colors.blue}20` : undefined,
                      }}
                    >
                      <CardContent className="p-6">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.blue}15 0%, ${theme.colors.lightBlue}15 100%)`,
                          }}
                        >
                          <feature.icon className="h-6 w-6" style={{ color: blue }} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-base font-semibold mb-2 text-gray-900">{feature.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{feature.text}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Next-Gen KI-Modules */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-8 text-gray-900"
              >
                Next-Gen KI-Modules
              </motion.h2>

              <div className="space-y-6">
                {/* Module Card 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="rounded-xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="h-32 mb-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                            <svg width="120" height="80" viewBox="0 0 120 80" className="overflow-visible">
                              <motion.polyline
                                points="10,60 30,45 50,50 70,30 90,40 110,25"
                                fill="none"
                                stroke={theme.colors.blue}
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                              />
                              {[10, 30, 50, 70, 90, 110].map((x, i) => (
                                <motion.circle
                                  key={i}
                                  cx={x}
                                  cy={[60, 45, 50, 30, 40, 25][i]}
                                  r="4"
                                  fill={theme.colors.blue}
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: i * 0.1 + 0.5 }}
                                />
                              ))}
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600">Klare Zahlen: Immer den Blick.</p>
                        </div>
                        <div>
                          <div className="h-32 mb-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
                            <svg width="120" height="80" viewBox="0 0 120 80" className="overflow-visible">
                              <motion.polyline
                                points="10,50 30,40 50,45 70,35 90,30 110,20"
                                fill="none"
                                stroke="#a855f7"
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                              />
                              {[10, 30, 50, 70, 90, 110].map((x, i) => (
                                <motion.circle
                                  key={i}
                                  cx={x}
                                  cy={[50, 40, 45, 35, 30, 20][i]}
                                  r="4"
                                  fill="#a855f7"
                                  initial={{ scale: 0 }}
                                  whileInView={{ scale: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: i * 0.1 + 0.8 }}
                                />
                              ))}
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600">Zuverlässige Prognosen. Treffende Entscheidungen.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Module Card 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="rounded-xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="h-32 mb-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center relative">
                            <FileText className="h-12 w-12 absolute" style={{ color: "#10b981" }} />
                            <svg width="120" height="80" viewBox="0 0 120 80" className="overflow-visible">
                              <motion.polyline
                                points="10,40 30,35 50,30 70,25 90,20 110,15"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600">Rechtschreibung automatisiert. Immer aktuell.</p>
                        </div>
                        <div>
                          <div className="h-32 mb-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg flex items-center justify-center relative">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <AlertCircle className="h-12 w-12" style={{ color: "#f97316" }} />
                            </motion.div>
                          </div>
                          <p className="text-sm text-gray-600">Ungewöhnliche Abweichungen? KI schlägt Alarm</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 relative z-10">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => setLocation("/auth")}
                size="lg" 
                className="rounded-lg px-12 h-16 text-lg font-semibold text-white shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                  boxShadow: `0 12px 40px ${theme.colors.blue}30`,
                }}
              >
                Zukunft jetzt starten
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-blue-100 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
              }}
            >
              <Receipt className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg font-semibold text-gray-900">{APP_TITLE}</span>
          </div>
          <p className="text-white/60 text-sm">© 2025 {APP_TITLE}. Automatische Rechnungsverarbeitung.</p>
        </div>
      </footer>
    </div>
  );
}
