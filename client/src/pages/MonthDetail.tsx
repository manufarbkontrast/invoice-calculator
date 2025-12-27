import { useAuth } from "@/_core/hooks/useAuth";
import { theme } from "@/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import {
  ArrowLeft,
  Download,
  Receipt,
  Trash2,
  TrendingUp,
  Loader2,
  Search,
  FileText,
  Edit2,
  Check,
  X,
  Calendar,
  LogOut,
  Building2,
  FolderArchive,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Filter,
  XCircle,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function MonthDetail() {
  const { month } = useParams<{ month: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [exchangeRate] = useState(0.92);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [editingInvoice, setEditingInvoice] = useState<number | null>(null);
  const [editToolName, setEditToolName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    currency: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: projects } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5,
  });

  const assignProjectMutation = trpc.invoices.assignProject.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Projekt zugewiesen");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateInvoiceMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingInvoice(null);
      toast.success("Aktualisiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const startEditing = (invoice: any) => {
    setEditingInvoice(invoice.id);
    setEditToolName(invoice.toolName || "");
    setEditCompanyName(invoice.companyName || "");
  };

  const cancelEditing = () => {
    setEditingInvoice(null);
    setEditToolName("");
    setEditCompanyName("");
  };

  const saveEditing = () => {
    if (editingInvoice) {
      updateInvoiceMutation.mutate({
        id: editingInvoice,
        toolName: editToolName.trim() || undefined,
        companyName: editCompanyName.trim() || undefined,
      });
    }
  };

  const { data: summary, isLoading, refetch } = trpc.invoices.monthlySummary.useQuery(
    { month: month! },
    { 
      enabled: isAuthenticated && !!month,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: false,
      staleTime: 1000 * 60 * 5,
    }
  );

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const exportMutation = trpc.invoices.exportExcel.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Excel erstellt");
    },
    onError: (error) => {
      toast.error(`Export fehlgeschlagen: ${error.message}`);
    },
  });

  const exportDatevMutation = trpc.invoices.exportDatev.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("DATEV-Export erstellt");
    },
    onError: (error) => {
      toast.error(`DATEV-Export fehlgeschlagen: ${error.message}`);
    },
  });

  const exportPdfMutation = trpc.invoices.exportPdf.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF-Report erstellt");
    },
    onError: (error) => {
      toast.error(`PDF-Export fehlgeschlagen: ${error.message}`);
    },
  });

  const togglePaidMutation = trpc.invoices.togglePaid.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedInvoiceIds([]);
      toast.success("Status aktualisiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.invoices.bulkDelete.useMutation({
    onSuccess: (data) => {
      refetch();
      setSelectedInvoiceIds([]);
      toast.success(`${data.count} Rechnungen gelöscht`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const bulkAssignProjectMutation = trpc.invoices.bulkAssignToProject.useMutation({
    onSuccess: (data) => {
      refetch();
      setSelectedInvoiceIds([]);
      toast.success(`${data.count} Rechnungen zugewiesen`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const bulkMarkAsPaidMutation = trpc.invoices.bulkMarkAsPaid.useMutation({
    onSuccess: (data) => {
      refetch();
      setSelectedInvoiceIds([]);
      toast.success(`${data.count} Rechnungen aktualisiert`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const downloadInvoiceMutation = trpc.invoices.download.useMutation({
    onSuccess: async (data) => {
      try {
        // Fetch the file as a blob
        const response = await fetch(data.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        
        // Create object URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = data.fileName || 'rechnung.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        window.URL.revokeObjectURL(blobUrl);
        toast.success("PDF heruntergeladen");
      } catch (error) {
        console.error("Download error:", error);
        toast.error(`Download fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      }
    },
    onError: (error) => {
      toast.error(`Download fehlgeschlagen: ${error.message}`);
    },
  });

  const downloadAllMutation = trpc.invoices.downloadAll.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success(`${data.count} Rechnungen als ZIP heruntergeladen`);
    },
    onError: (error) => {
      toast.error(`Download fehlgeschlagen: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || isLoading) {
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

  if (!isAuthenticated || !summary) {
    return null;
  }

  const monthName = new Date(month + "-01").toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
  });

  const handleExport = () => {
    exportMutation.mutate({ month: month!, exchangeRate });
  };

  const convertToEUR = (amount: number, currency: string) => {
    if (currency === "EUR") return amount;
    return Math.round(amount * exchangeRate);
  };

  const handleProjectAssign = (invoiceId: number, projectId: string) => {
    assignProjectMutation.mutate({
      invoiceId,
      projectId: projectId === "none" ? null : parseInt(projectId),
    });
  };

  // Eindeutige Firmen für Filter
  const uniqueCompanies = Array.from(new Set(summary?.invoices.map(inv => inv.companyName).filter(Boolean) || [])).sort();

  // Filter and sort
  const filteredAndSortedInvoices = (() => {
    const filtered = summary?.invoices.filter((invoice) => {
      const matchesSearch = searchTerm === "" ||
        invoice.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
      const matchesProject = filterProject === "all" ||
        (filterProject === "none" && !invoice.projectId) ||
        invoice.projectId?.toString() === filterProject;
      const matchesCompany = filterCompany === "all" || invoice.companyName === filterCompany;
      return matchesSearch && matchesStatus && matchesProject && matchesCompany;
    }) || [];

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc": return new Date(a.invoiceDate || 0).getTime() - new Date(b.invoiceDate || 0).getTime();
        case "date-desc": return new Date(b.invoiceDate || 0).getTime() - new Date(a.invoiceDate || 0).getTime();
        case "amount-asc": return convertToEUR(a.amount, a.currency) - convertToEUR(b.amount, b.currency);
        case "amount-desc": return convertToEUR(b.amount, b.currency) - convertToEUR(a.amount, a.currency);
        default: return 0;
      }
    });

    return sorted;
  })();

  // Alle PDFs herunterladen
  const handleDownloadAll = async () => {
    if (!filteredAndSortedInvoices.length) return;
    
    setDownloadingAll(true);
    try {
      const invoiceIds = filteredAndSortedInvoices.map(inv => inv.id);
      downloadAllMutation.mutate({ 
        month: month!,
        invoiceIds 
      });
    } catch (error) {
      toast.error("Fehler beim Herunterladen");
    } finally {
      setDownloadingAll(false);
    }
  };

  // Einzelne PDF herunterladen
  const handleDownloadSingle = (invoice: typeof filteredAndSortedInvoices[0]) => {
    downloadInvoiceMutation.mutate({ id: invoice.id });
  };

  const handleDelete = (id: number) => {
    if (confirm("Rechnung wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
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
              <h1 className="text-2xl font-medium tracking-tight text-gray-900">{APP_TITLE}</h1>
              <p className="text-sm text-gray-500">Rechnungsverwaltung</p>
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
                  <h1 className="text-lg font-medium text-gray-900">Menü</h1>
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                }}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </button>

              <button
                onClick={() => { setLocation("/analytics"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analyse & Statistiken</span>
              </button>

              <button
                onClick={() => { setLocation("/projects"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <FolderKanban className="h-5 w-5" />
                <span>Projekte</span>
              </button>

              <button
                onClick={() => { setLocation("/teams"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <Users className="h-5 w-5" />
                <span>Teams</span>
              </button>

              <button
                onClick={() => { setLocation("/settings"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <User className="h-5 w-5" />
                <span>Profil bearbeiten</span>
              </button>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-blue-100">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5" style={{ color: theme.colors.blue }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
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

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Back Button & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-6">
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
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900">{monthName}</h2>
              <p className="text-base sm:text-lg text-gray-600 mt-1">{summary.invoices.length} Rechnungen</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={handleDownloadAll} 
              disabled={downloadingAll || downloadAllMutation.isPending || filteredAndSortedInvoices.length === 0}
              size="lg"
              variant="outline"
              className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
            >
              {(downloadingAll || downloadAllMutation.isPending) ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <FolderArchive className="h-5 w-5 mr-2" />
              )}
              Alle PDFs ({filteredAndSortedInvoices.length})
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={exportMutation.isPending}
              size="lg"
              variant="outline"
              className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 mr-2" />
              )}
              Excel
            </Button>
            <Button 
              onClick={() => exportDatevMutation.mutate({ month: month! })} 
              disabled={exportDatevMutation.isPending}
              size="lg"
              variant="outline"
              className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
            >
              {exportDatevMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <FileText className="h-5 w-5 mr-2" />
              )}
              DATEV
            </Button>
            <Button 
              onClick={() => exportPdfMutation.mutate({ month: month! })} 
              disabled={exportPdfMutation.isPending}
              size="lg"
              className="text-white rounded-xl px-6"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                boxShadow: theme.shadows.md,
              }}
            >
              {exportPdfMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              PDF-Report
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-10"
        >
          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Rechnungen</p>
                  <p className="text-2xl sm:text-3xl font-light text-gray-900">{summary.invoices.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6" style={{ color: theme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Bezahlt</p>
                  <p className="text-3xl font-light text-green-600">{summary.paidCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Offen</p>
                  <p className="text-3xl font-light text-orange-500">{summary.pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Circle className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-white/60 text-sm mb-1">Gesamt</p>
                  <p className="text-3xl font-light">€{(summary.totalInEUR / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-blue-100 rounded-3xl bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 sm:h-14 border-blue-200 focus:border-blue-500 rounded-xl text-sm sm:text-base"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="h-12 sm:h-14 border-blue-200 rounded-xl"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Erweiterte Suche
                  </Button>
                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="w-full md:w-[200px] h-12 sm:h-14 border-blue-200 rounded-xl">
                    <SelectValue placeholder="Firma" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Alle Firmen
                      </div>
                    </SelectItem>
                    {uniqueCompanies.map((company) => (
                      <SelectItem key={company} value={company as string}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-full md:w-[180px] h-12 sm:h-14 border-blue-200 rounded-xl">
                    <SelectValue placeholder="Projekt" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Alle Projekte</SelectItem>
                    <SelectItem value="none">Ohne Projekt</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || "#000" }} />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[140px] h-12 sm:h-14 border-blue-200 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="completed">Fertig</SelectItem>
                    <SelectItem value="processing">Läuft</SelectItem>
                    <SelectItem value="failed">Fehler</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[180px] h-12 sm:h-14 border-blue-200 rounded-xl">
                    <SelectValue placeholder="Sortieren" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="date-desc">Datum ↓</SelectItem>
                    <SelectItem value="date-asc">Datum ↑</SelectItem>
                    <SelectItem value="amount-desc">Betrag ↓</SelectItem>
                    <SelectItem value="amount-asc">Betrag ↑</SelectItem>
                  </SelectContent>
                </Select>
                </div>

                {/* Advanced Search */}
                {showAdvancedSearch && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-blue-100">
                    <div className="space-y-2">
                      <Label className="text-sm">Von Datum</Label>
                      <Input
                        type="date"
                        value={advancedFilters.dateFrom}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateFrom: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Bis Datum</Label>
                      <Input
                        type="date"
                        value={advancedFilters.dateTo}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateTo: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Min. Betrag (€)</Label>
                      <Input
                        type="number"
                        value={advancedFilters.amountMin}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, amountMin: e.target.value })}
                        className="h-10"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max. Betrag (€)</Label>
                      <Input
                        type="number"
                        value={advancedFilters.amountMax}
                        onChange={(e) => setAdvancedFilters({ ...advancedFilters, amountMax: e.target.value })}
                        className="h-10"
                        placeholder="10000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Währung</Label>
                      <Select value={advancedFilters.currency} onValueChange={(value) => setAdvancedFilters({ ...advancedFilters, currency: value })}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Alle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Alle</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invoices Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-black/10 rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-light">Rechnungen</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Alle Rechnungen für {monthName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {filteredAndSortedInvoices.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="h-16 w-16 mx-auto mb-6" style={{ color: theme.colors.blue + '40' }} strokeWidth={1} />
                  <p className="text-lg sm:text-xl text-gray-600">Keine Rechnungen gefunden</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Bulk Actions Bar */}
                  {selectedInvoiceIds.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedInvoiceIds.length} Rechnung{selectedInvoiceIds.length !== 1 ? 'en' : ''} ausgewählt
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const projectId = prompt("Projekt-ID eingeben (oder leer für 'Ohne Projekt'):");
                            if (projectId !== null) {
                              bulkAssignProjectMutation.mutate({
                                ids: selectedInvoiceIds,
                                projectId: projectId === "" ? null : parseInt(projectId),
                              });
                            }
                          }}
                          disabled={bulkAssignProjectMutation.isPending}
                        >
                          Projekt zuweisen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Als bezahlt markieren?")) {
                              bulkMarkAsPaidMutation.mutate({
                                ids: selectedInvoiceIds,
                                isPaid: true,
                              });
                            }
                          }}
                          disabled={bulkMarkAsPaidMutation.isPending}
                        >
                          Als bezahlt markieren
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`${selectedInvoiceIds.length} Rechnungen wirklich löschen?`)) {
                              bulkDeleteMutation.mutate({ ids: selectedInvoiceIds });
                            }
                          }}
                          disabled={bulkDeleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoiceIds([])}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-100">
                        <TableHead className="w-12">
                          <button
                            onClick={() => {
                              if (selectedInvoiceIds.length === filteredAndSortedInvoices.length) {
                                setSelectedInvoiceIds([]);
                              } else {
                                setSelectedInvoiceIds(filteredAndSortedInvoices.map(inv => inv.id));
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {selectedInvoiceIds.length === filteredAndSortedInvoices.length ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4">Tool</TableHead>
                        <TableHead className="text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4">Firma</TableHead>
                        <TableHead className="text-right text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4">Betrag</TableHead>
                        <TableHead className="text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4 hidden md:table-cell">Projekt</TableHead>
                        <TableHead className="text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4 hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-center text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4">Bezahlt</TableHead>
                        <TableHead className="text-right text-gray-600 font-medium text-sm sm:text-base py-3 sm:py-4">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredAndSortedInvoices.map((invoice) => (
                          <motion.tr
                            key={invoice.id}
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className={`border-blue-100 hover:bg-blue-50 transition-colors ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-50' : ''}`}
                          >
                            <TableCell>
                              <button
                                onClick={() => {
                                  if (selectedInvoiceIds.includes(invoice.id)) {
                                    setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== invoice.id));
                                  } else {
                                    setSelectedInvoiceIds([...selectedInvoiceIds, invoice.id]);
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                {selectedInvoiceIds.includes(invoice.id) ? (
                                  <CheckSquare className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="font-medium text-base py-5">
                              {editingInvoice === invoice.id ? (
                                <Input
                                  value={editToolName}
                                  onChange={(e) => setEditToolName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveEditing();
                                    } else if (e.key === "Escape") {
                                      cancelEditing();
                                    }
                                  }}
                                  autoFocus
                                  className="h-9 sm:h-10 border-blue-200 rounded-lg font-medium text-sm sm:text-base"
                                />
                              ) : (
                                <div className="flex items-center gap-3 group">
                                  <span className="cursor-pointer" onClick={() => startEditing(invoice)}>
                                    {invoice.toolName || "—"}
                                  </span>
                                  <button
                                    onClick={() => startEditing(invoice)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Bearbeiten"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-700 text-sm sm:text-base py-3 sm:py-5">
                              {editingInvoice === invoice.id ? (
                                <Input
                                  value={editCompanyName}
                                  onChange={(e) => setEditCompanyName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveEditing();
                                    } else if (e.key === "Escape") {
                                      cancelEditing();
                                    }
                                  }}
                                  className="h-9 sm:h-10 border-blue-200 rounded-lg text-sm sm:text-base"
                                />
                              ) : (
                                <div className="flex items-center gap-3 group">
                                  <span className="cursor-pointer" onClick={() => startEditing(invoice)}>
                                    {invoice.companyName || "—"}
                                  </span>
                                  <button
                                    onClick={() => startEditing(invoice)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Bearbeiten"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-base py-5">
                              €{(convertToEUR(invoice.amount, invoice.currency) / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="py-5">
                              <Select
                                value={invoice.projectId?.toString() || "none"}
                                onValueChange={(value) => handleProjectAssign(invoice.id, value)}
                                disabled={assignProjectMutation.isPending}
                              >
                                <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 border-blue-200 rounded-lg text-sm sm:text-base">
                                  <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="none">—</SelectItem>
                                  {projects?.map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || "#000" }} />
                                        {project.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-5">
                              {invoice.status === "completed" && (
                                <Badge className="bg-black text-white px-4 py-1 text-sm">OK</Badge>
                              )}
                              {invoice.status === "processing" && (
                                <Badge variant="outline" className="border-blue-200 px-3 sm:px-4 py-1 text-xs sm:text-sm">
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Läuft
                                </Badge>
                              )}
                              {invoice.status === "failed" && (
                                <Badge variant="destructive" className="px-4 py-1 text-sm">Fehler</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-5">
                              <button
                                onClick={() => togglePaidMutation.mutate({ id: invoice.id, isPaid: invoice.paymentStatus !== "paid" })}
                                disabled={togglePaidMutation.isPending}
                                className={`p-2 rounded-lg transition-all ${
                                  invoice.paymentStatus === "paid" 
                                    ? "bg-green-100 text-green-600 hover:bg-green-200" 
                                    : "bg-blue-50 text-gray-400 hover:bg-blue-100 hover:text-gray-600"
                                }`}
                                title={invoice.paymentStatus === "paid" ? "Als unbezahlt markieren" : "Als bezahlt markieren"}
                              >
                                {invoice.paymentStatus === "paid" ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="text-right py-5">
                              {editingInvoice === invoice.id ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={saveEditing}
                                    disabled={updateInvoiceMutation.isPending}
                                    className="h-10 w-10 p-0 rounded-lg border-green-200 hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditing}
                                    className="h-10 w-10 p-0 rounded-lg border-red-200 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadSingle(invoice)}
                                    disabled={downloadInvoiceMutation.isPending}
                                    className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg border-blue-200 hover:bg-blue-600 hover:text-white"
                                    title="PDF herunterladen"
                                  >
                                    {downloadInvoiceMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(invoice.fileUrl, "_blank")}
                                    className="h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg border-blue-200 hover:bg-blue-600 hover:text-white"
                                    title="PDF ansehen"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(invoice.id)}
                                    disabled={deleteMutation.isPending}
                                    className="h-10 w-10 p-0 rounded-lg border-red-200 hover:bg-red-50"
                                    title="Löschen"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
