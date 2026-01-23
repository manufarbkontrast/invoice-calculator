import { useAuth } from "@/_core/hooks/useAuth";
import { theme } from "@/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import {
  ArrowLeft,
  Receipt,
  LogOut,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  FileText,
  Building2,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PanelRightOpen,
  X,
  Home,
  FolderKanban,
  Users,
  User,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [exchangeRate] = useState(0.92);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: projects } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: invoices } = trpc.invoices.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: recurringInvoices } = trpc.invoices.recurring.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: duplicateInvoices } = trpc.invoices.duplicates.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading) {
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

  if (!isAuthenticated) {
    return null;
  }

  const convertToEUR = (amount: number, currency: string) => {
    if (currency === "EUR") return amount;
    return Math.round(amount * exchangeRate);
  };

  // Prepare data for project spending chart
  const projectSpendingData = projects?.map((project) => {
    const projectInvoices = invoices?.filter((inv) => inv.projectId === project.id) || [];
    const totalAmount = projectInvoices.reduce((sum, inv) => {
      return sum + convertToEUR(inv.amount, inv.currency);
    }, 0);

    // Weiße Farben durch Schwarz ersetzen für bessere Sichtbarkeit
    const projectColor = project.color?.toLowerCase() === "#ffffff" || project.color?.toLowerCase() === "#fff" 
      ? "#000000" 
      : (project.color || "#000000");

    return {
      name: project.name,
      amount: totalAmount / 100,
      count: projectInvoices.length,
      color: projectColor,
    };
  }) || [];

  // Add unassigned invoices
  const unassignedInvoices = invoices?.filter((inv) => !inv.projectId) || [];
  if (unassignedInvoices.length > 0) {
    const unassignedTotal = unassignedInvoices.reduce((sum, inv) => {
      return sum + convertToEUR(inv.amount, inv.currency);
    }, 0);
    projectSpendingData.push({
      name: "Ohne Projekt",
      amount: unassignedTotal / 100,
      count: unassignedInvoices.length,
      color: "#e5e5e5",
    });
  }

  // Prepare data for monthly spending chart
  const monthlySpendingMap = new Map<string, number>();
  invoices?.forEach((invoice) => {
    const month = invoice.month;
    const amountEUR = convertToEUR(invoice.amount, invoice.currency);
    monthlySpendingMap.set(month, (monthlySpendingMap.get(month) || 0) + amountEUR);
  });

  const monthlySpendingData = Array.from(monthlySpendingMap.entries())
    .map(([month, amount]) => ({
      month,
      amount: amount / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Prepare data for tool spending chart
  const toolSpendingMap = new Map<string, number>();
  invoices?.forEach((invoice) => {
    const tool = invoice.toolName || "Unbekannt";
    const amountEUR = convertToEUR(invoice.amount, invoice.currency);
    toolSpendingMap.set(tool, (toolSpendingMap.get(tool) || 0) + amountEUR);
  });

  const toolSpendingData = Array.from(toolSpendingMap.entries())
    .map(([tool, amount]) => ({
      tool,
      amount: amount / 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Calculate statistics
  const totalSpending = (invoices?.reduce((sum, inv) => {
    return sum + convertToEUR(inv.amount, inv.currency);
  }, 0) || 0) / 100;

  const averageInvoice = invoices && invoices.length > 0 
    ? totalSpending / invoices.length 
    : 0;

  const monthCount = monthlySpendingData.length;
  const averageMonthly = monthCount > 0 ? totalSpending / monthCount : 0;

  // Company spending data
  const companySpendingMap = new Map<string, number>();
  invoices?.forEach((invoice) => {
    const company = invoice.companyName || "Unbekannt";
    const amountEUR = convertToEUR(invoice.amount, invoice.currency);
    companySpendingMap.set(company, (companySpendingMap.get(company) || 0) + amountEUR);
  });

  const companySpendingData = Array.from(companySpendingMap.entries())
    .map(([company, amount]) => ({
      company,
      amount: amount / 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Payment status data
  const paidCount = invoices?.filter(inv => inv.paymentStatus === "paid").length || 0;
  const pendingCount = invoices?.filter(inv => inv.paymentStatus === "pending").length || 0;
  const overdueCount = invoices?.filter(inv => inv.paymentStatus === "overdue").length || 0;

  const paymentStatusData = [
    { name: "Bezahlt", value: paidCount, color: "#22c55e" },
    { name: "Offen", value: pendingCount, color: "#f97316" },
    { name: "Überfällig", value: overdueCount, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Monthly comparison (current vs previous)
  const sortedMonths = [...monthlySpendingData].sort((a, b) => b.month.localeCompare(a.month));
  const currentMonth = sortedMonths[0];
  const previousMonth = sortedMonths[1];
  const monthlyChange = currentMonth && previousMonth 
    ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount * 100)
    : 0;

  // Recurring invoices total
  const recurringTotal = recurringInvoices?.reduce((sum, group) => sum + group.totalAmount, 0) || 0;
  const recurringCount = recurringInvoices?.length || 0;

  // Duplicate count
  const duplicateCount = duplicateInvoices?.length || 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xl">
          <p className="font-medium text-blue-600">{label || payload[0].name || payload[0].payload.name}</p>
          <p className="text-lg text-gray-700 mt-1">
            €{payload[0].value.toFixed(2)}
          </p>
          {payload[0].payload.count && (
            <p className="text-sm text-gray-500 mt-1">
              {payload[0].payload.count} Rechnung(en)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bgGradient }}>
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100"
      >
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                boxShadow: theme.shadows.md,
              }}
            >
              <Receipt className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-medium text-blue-600">{APP_TITLE}</span>
              <p className="text-xs text-gray-500">Rechnungsverwaltung</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm sm:text-base text-gray-600 hidden sm:inline">{user?.email}</span>
            
            {/* Menu Toggle Button */}
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setSidebarOpen(true)}
              className="border-blue-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl px-4"
            >
              <PanelRightOpen className="h-5 w-5 mr-2" />
              Menü
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{
              backgroundColor: `${theme.colors.blue}15`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Right Side */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-72 flex-col fixed right-0 top-0 bottom-0 bg-white border-l border-blue-100 z-50 shadow-2xl flex"
          >
            {/* Header */}
            <div className="p-5 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                  }}
                >
                  <Receipt className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-blue-600">Menü</h1>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-3">Navigation</p>
              
              <button
                onClick={() => { setLocation("/dashboard"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => { setLocation("/analytics"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                }}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Analyse & Statistiken</span>
              </button>

              <button
                onClick={() => { setLocation("/projects"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <FolderKanban className="h-5 w-5" />
                <span>Projekte</span>
              </button>

            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-blue-100">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5" style={{ color: theme.colors.blue }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-600 truncate">{user?.email}</p>
                  <p className="text-xs text-gray-500">Angemeldet</p>
                </div>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full mt-3 border-blue-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        {/* Back Button & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-8"
        >
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setLocation("/dashboard")} 
            className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white transition-all rounded-xl"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Zurück
          </Button>
          <div>
            <h2 className="text-2xl font-medium text-blue-600 flex items-center gap-3">
              <BarChart3 className="h-8 w-8" style={{ color: theme.colors.blue }} strokeWidth={1.5} />
              Analyse
            </h2>
            <p className="text-sm text-gray-500 mt-1">Übersicht und Statistiken</p>
          </div>
        </motion.div>

        {/* Main Statistics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <Card 
            className="border-0 text-white rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
              boxShadow: theme.shadows.md,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs mb-1">Gesamt</p>
                  <p className="text-2xl font-medium">€{totalSpending.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Ø Rechnung</p>
                  <p className="text-2xl font-medium text-blue-600">€{averageInvoice.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5" style={{ color: theme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Ø Monat</p>
                  <p className="text-2xl font-medium text-blue-600">€{averageMonthly.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5" style={{ color: theme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Rechnungen</p>
                  <p className="text-2xl font-medium text-blue-600">{invoices?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Receipt className="h-5 w-5" style={{ color: theme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Secondary Statistics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid md:grid-cols-5 gap-4 mb-10"
        >
          {/* Monthly Change */}
          <Card className={`rounded-2xl overflow-hidden ${monthlyChange >= 0 ? 'border-red-100' : 'border-green-100'}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  monthlyChange > 0 ? 'bg-red-100' : monthlyChange < 0 ? 'bg-green-100' : 'bg-blue-50'
                }`}>
                  {monthlyChange > 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  ) : monthlyChange < 0 ? (
                    <ArrowDownRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">vs. Vorm.</p>
                  <p className={`text-lg font-bold ${
                    monthlyChange > 0 ? 'text-red-600' : monthlyChange < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paid */}
          <Card className="border-green-100 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bezahlt</p>
                  <p className="text-lg font-bold text-green-600">{paidCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="border-orange-100 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Circle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Offen</p>
                  <p className="text-lg font-bold text-orange-500">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring */}
          <Card className="border-blue-100 rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Repeat className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Wiederkeh.</p>
                  <p className="text-lg font-bold text-blue-600">{recurringCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicates */}
          <Card className={`rounded-2xl overflow-hidden ${duplicateCount > 0 ? 'border-yellow-100' : 'border-black/10'}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  duplicateCount > 0 ? 'bg-yellow-100' : 'bg-black/5'
                }`}>
                  <AlertTriangle className={`h-5 w-5 ${duplicateCount > 0 ? 'text-yellow-600' : 'text-black/40'}`} />
                </div>
                <div>
                  <p className={`text-xs ${duplicateCount > 0 ? 'text-gray-500' : 'text-gray-400'}`}>Duplikate</p>
                  <p className={`text-lg font-bold ${duplicateCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{duplicateCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Project Spending Charts */}
          {projectSpendingData.length > 0 && (
            <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-8">
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <BarChart3 className="h-6 w-6" strokeWidth={1.5} />
                    Nach Projekt
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Ausgaben pro Projekt</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={projectSpendingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#666', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {projectSpendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <PieChartIcon className="h-6 w-6" strokeWidth={1.5} />
                    Verteilung
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Prozentuale Aufteilung</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={projectSpendingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        dataKey="amount"
                      >
                        {projectSpendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Monthly Spending Chart */}
          {monthlySpendingData.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <Calendar className="h-6 w-6" strokeWidth={1.5} />
                    Monatlicher Verlauf
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Ausgaben über Zeit</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlySpendingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke={theme.colors.blue}
                        strokeWidth={3}
                        dot={{ fill: theme.colors.blue, r: 6 }}
                        activeDot={{ r: 8, fill: theme.colors.blue }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tool Spending Chart */}
          {toolSpendingData.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <TrendingUp className="h-6 w-6" strokeWidth={1.5} />
                    Top 10 Tools
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Die teuersten Tools</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={toolSpendingData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="tool" 
                        tick={{ fill: '#666', fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill={theme.colors.blue} radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Company Spending & Payment Status */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-8">
            {/* Top Companies */}
            {companySpendingData.length > 0 && (
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <Building2 className="h-6 w-6" strokeWidth={1.5} />
                    Top 10 Firmen
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Ausgaben nach Lieferant</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={companySpendingData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="company" 
                        tick={{ fill: '#666', fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Payment Status */}
            {paymentStatusData.length > 0 && (
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
                    Zahlungsstatus
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">Übersicht der Zahlungen</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {paymentStatusData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm text-gray-600">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Recurring Invoices */}
          {recurringInvoices && recurringInvoices.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium">
                    <Repeat className="h-6 w-6" strokeWidth={1.5} />
                    Wiederkehrende Ausgaben
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-sm">
                    Automatisch erkannte wiederkehrende Rechnungen
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recurringInvoices.map((group) => (
                      <div
                        key={group.groupId}
                        className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-blue-600">{group.toolName}</p>
                            <p className="text-sm text-gray-600">{group.companyName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-medium text-blue-600">
                              €{(group.totalAmount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">{group.count} Rechnungen</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-800">Gesamte wiederkehrende Kosten</p>
                        <p className="text-xl font-medium text-blue-600">
                          €{(recurringTotal / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} / Zeitraum
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Duplicate Warnings */}
          {duplicateInvoices && duplicateInvoices.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card className="border-yellow-200 bg-yellow-50 rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl font-medium text-yellow-800">
                    <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />
                    Mögliche Duplikate erkannt
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    Diese Rechnungen könnten doppelt hochgeladen worden sein
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="space-y-3">
                    {duplicateInvoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 bg-white rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-blue-600">{invoice.toolName || invoice.fileName}</p>
                          <p className="text-sm text-gray-600">{invoice.companyName} • {invoice.month}</p>
                        </div>
                        <p className="text-lg font-medium text-blue-600">
                          €{(invoice.amount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {(!invoices || invoices.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="text-center py-20 border-blue-100 rounded-3xl bg-white">
              <CardContent>
                <BarChart3 className="h-20 w-20 mx-auto mb-6" style={{ color: theme.colors.blue + '40' }} strokeWidth={1} />
                <h3 className="text-xl font-medium mb-3 text-blue-600">Noch keine Daten</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Laden Sie Rechnungen hoch, um Analysen zu sehen
                </p>
                <Button 
                  onClick={() => setLocation("/dashboard")}
                  size="lg"
                  className="text-white rounded-xl px-8"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  Zum Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
