import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { Receipt, TrendingUp, FileSpreadsheet, Zap, ArrowRight, Shield, Clock, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5"
      >
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-2xl font-medium tracking-tight text-black">{APP_TITLE}</span>
          </div>
          <Button 
            onClick={() => setLocation("/auth")}
            size="lg"
            className="bg-black hover:bg-black/90 text-white rounded-xl px-8 h-12 text-base"
          >
            Anmelden
          </Button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-black/5 rounded-full text-base text-black/70">
                <Sparkles className="h-5 w-5" />
                KI-gestützte Rechnungsverarbeitung
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-6xl md:text-8xl font-light text-black leading-[1.1] tracking-tight mb-8"
            >
              Ihre Rechnungen.
              <br />
              <span className="text-black/30">Automatisch verwaltet.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-2xl text-black/40 max-w-3xl mx-auto leading-relaxed mb-12"
            >
              Laden Sie PDF-Rechnungen hoch und erhalten Sie automatisch eine übersichtliche Kalkulation. 
              Exportieren Sie monatliche Zusammenfassungen als Excel-Datei.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation("/auth")}
                size="lg" 
                className="bg-black hover:bg-black/90 text-white rounded-2xl px-12 h-16 text-xl group"
              >
                <span className="flex items-center gap-3">
                  Jetzt kostenlos starten
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                </span>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-8 mt-16 text-black/30"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Sicher & Verschlüsselt</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Sofortige Verarbeitung</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span>KI-Extraktion</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-black/[0.02]">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light text-black mb-4">
              Alles was Sie brauchen
            </h2>
            <p className="text-xl text-black/40">
              Leistungsstarke Funktionen für Ihre Rechnungsverwaltung
            </p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {[
              {
                icon: Zap,
                title: "KI-gestützte Extraktion",
                description: "Automatische Erkennung von Tool-Namen, Firmen und Beträgen aus Ihren PDF-Rechnungen. Keine manuelle Eingabe mehr nötig."
              },
              {
                icon: TrendingUp,
                title: "Monatliche Übersicht",
                description: "Gruppierung nach Monaten mit automatischer Berechnung der Gesamtkosten. Behalten Sie den Überblick über Ihre Ausgaben."
              },
              {
                icon: FileSpreadsheet,
                title: "Excel-Export",
                description: "Professionelle Excel-Kalkulationen mit anpassbarem Wechselkurs. Perfekt für Ihre Buchhaltung und Steuererklärung."
              },
              {
                icon: Receipt,
                title: "Projekt-Organisation",
                description: "Ordnen Sie Rechnungen Projekten zu und analysieren Sie Ihre Ausgaben nach Kategorien. Volle Kontrolle über Ihre Finanzen."
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="border-black/10 rounded-3xl hover:border-black/30 transition-all duration-300 h-full overflow-hidden group">
                  <CardContent className="p-10">
                    <div className="w-20 h-20 rounded-2xl bg-black/5 flex items-center justify-center mb-8 group-hover:bg-black group-hover:scale-105 transition-all duration-300">
                      <feature.icon className="h-10 w-10 text-black/60 group-hover:text-white transition-colors" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-light text-black mb-4">{feature.title}</h3>
                    <p className="text-lg text-black/40 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-black rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-10 right-10 w-64 h-64 border border-white rounded-full" />
              <div className="absolute bottom-20 left-10 w-48 h-48 border border-white rounded-full" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                Bereit durchzustarten?
              </h2>
              <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
                Starten Sie jetzt und sparen Sie Zeit bei der Verwaltung Ihrer Tool-Ausgaben. 
                Kostenlos und ohne Kreditkarte.
              </p>
              <Button 
                onClick={() => setLocation("/auth")}
                size="lg" 
                className="bg-white text-black hover:bg-white/90 rounded-2xl px-12 h-16 text-xl font-medium"
              >
                Kostenlos registrieren
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/5">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-medium text-black tracking-tight">{APP_TITLE}</span>
          </div>
          <p className="text-black/30">© 2025 {APP_TITLE}. Automatische Rechnungsverarbeitung mit KI.</p>
        </div>
      </footer>
    </div>
  );
}
