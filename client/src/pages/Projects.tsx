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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  FolderKanban,
  Plus,
  Receipt,
  LogOut,
  Trash2,
  Search,
  FileText,
  TrendingUp,
  Palette,
  Download,
  Loader2,
  FolderArchive,
  PanelRightOpen,
  X,
  Home,
  BarChart3,
  Users,
  User,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

export default function Projects() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const projectIdFromUrl = urlParams.get('project');
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#000000");
  const [exchangeRate] = useState(0.92);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [editingColorProjectId, setEditingColorProjectId] = useState<number | null>(null);
  const [editingColor, setEditingColor] = useState("#000000");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: projects, refetch: refetchProjects } = trpc.projects.list.useQuery(undefined, {
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

  useEffect(() => {
    if (projectIdFromUrl && projects) {
      setTimeout(() => {
        const element = document.getElementById(`project-${projectIdFromUrl}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [projectIdFromUrl, projects]);

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projekt erstellt");
      setProjectDialogOpen(false);
      setNewProjectName("");
      setNewProjectColor("#000000");
      refetchProjects();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const initializeDefaultsMutation = trpc.projects.initializeDefaults.useMutation({
    onSuccess: () => {
      toast.success("Standard-Projekte hinzugefügt");
      refetchProjects();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projekt gelöscht");
      refetchProjects();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Farbe geändert");
      setEditingColorProjectId(null);
      refetchProjects();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const downloadProjectMutation = trpc.projects.downloadAll.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success(`${data.count} Rechnungen heruntergeladen`);
    },
    onError: (error) => {
      toast.error(`Download fehlgeschlagen: ${error.message}`);
    },
  });

  const handleColorChange = (projectId: number, color: string) => {
    setEditingColorProjectId(projectId);
    setEditingColor(color || "#000000");
  };

  const saveColor = () => {
    if (editingColorProjectId) {
      updateProjectMutation.mutate({
        id: editingColorProjectId,
        color: editingColor,
      });
    }
  };

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

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Projekt wirklich löschen?")) {
      deleteProjectMutation.mutate({ id: projectId });
    }
  };

  // Group invoices by project
  const projectsWithInvoices = projects?.map((project) => {
    const projectInvoices = invoices?.filter((inv) => inv.projectId === project.id) || [];
    const totalAmount = projectInvoices.reduce((sum, inv) => {
      return sum + convertToEUR(inv.amount, inv.currency);
    }, 0);

    return {
      ...project,
      invoices: projectInvoices,
      totalAmount,
    };
  }) || [];

  const unassignedInvoices = invoices?.filter((inv) => !inv.projectId) || [];
  const unassignedTotal = unassignedInvoices.reduce((sum, inv) => {
    return sum + convertToEUR(inv.amount, inv.currency);
  }, 0);

  const totalProjectAmount = projectsWithInvoices.reduce((sum, p) => sum + p.totalAmount, 0);

  // Filter and sort
  const filteredAndSortedProjects = (() => {
    const filtered = projectsWithInvoices.filter((project) => {
      const matchesSearch = searchTerm === "" || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.invoices.some(inv => 
          inv.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "amount-asc": return a.totalAmount - b.totalAmount;
        case "amount-desc": return b.totalAmount - a.totalAmount;
        case "count-asc": return a.invoices.length - b.invoices.length;
        case "count-desc": return b.invoices.length - a.invoices.length;
        default: return 0;
      }
    });

    return sorted;
  })();

  const filteredUnassigned = unassignedInvoices.filter((invoice) => {
    if (searchTerm === "") return true;
    return invoice.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           invoice.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-blue-600">{APP_TITLE}</h1>
              <p className="text-xs sm:text-sm text-gray-500">Rechnungsverwaltung</p>
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analyse & Statistiken</span>
              </button>

              <button
                onClick={() => { setLocation("/projects"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                }}
              >
                <FolderKanban className="h-5 w-5" />
                <span className="font-medium">Projekte</span>
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
              className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white transition-all rounded-xl text-sm sm:text-base px-4 sm:px-6"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Zurück
            </Button>
            <div>
              <h2 className="text-3xl sm:text-4xl font-light text-blue-600 flex items-center gap-3">
                <FolderKanban className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: theme.colors.blue }} strokeWidth={1.5} />
                Projekte
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mt-1">Verwalten Sie Ihre Projekte</p>
            </div>
          </div>

          <div className="flex gap-3">
            {(!projects || projects.length === 0) && (
              <Button 
                onClick={() => initializeDefaultsMutation.mutate()}
                disabled={initializeDefaultsMutation.isPending}
                size="lg"
                variant="outline"
                className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
              >
                {initializeDefaultsMutation.isPending ? "Wird hinzugefügt..." : "Standard-Projekte"}
              </Button>
            )}
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="text-white rounded-xl px-6 sm:px-8 text-sm sm:text-base"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Neues Projekt
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-blue-100 p-6 sm:p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-medium">Neues Projekt</DialogTitle>
                  <DialogDescription className="text-gray-600 text-sm sm:text-base">
                    Erstellen Sie ein Projekt zur Organisation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-3">
                    <Label htmlFor="project-name" className="text-base">Projektname</Label>
                    <Input
                      id="project-name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="z.B. Marketing Tools"
                      className="h-12 sm:h-14 rounded-xl border-blue-200 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="project-color" className="text-base">Farbe</Label>
                    <div className="flex gap-3">
                      <Input
                        id="project-color"
                        type="color"
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        className="w-16 sm:w-20 h-12 sm:h-14 p-2 rounded-xl border-blue-200"
                      />
                      <Input
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 h-12 sm:h-14 rounded-xl border-blue-200 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (newProjectName.trim()) {
                        createProjectMutation.mutate({
                          name: newProjectName,
                          color: newProjectColor,
                        });
                      }
                    }}
                    disabled={!newProjectName.trim() || createProjectMutation.isPending}
                    size="lg"
                    className="text-white rounded-xl px-6 sm:px-8 text-sm sm:text-base"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                      boxShadow: theme.shadows.md,
                    }}
                  >
                    Erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-10"
        >
          <Card
            className="border-0 text-white rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
              boxShadow: theme.shadows.md,
            }}
          >
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-white/60 text-sm sm:text-base md:text-lg mb-2">Gesamt zugeordnet</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-light break-all">€{(totalProjectAmount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-2">Projekte</p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900">{projects?.length || 0}</p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" style={{ color: theme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-2">Nicht zugeordnet</p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900">{unassignedInvoices.length}</p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" style={{ color: theme.colors.blue }} />
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
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Projekte durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 sm:h-14 border-blue-200 focus:border-blue-500 rounded-xl text-sm sm:text-base"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[220px] h-12 sm:h-14 border-blue-200 rounded-xl text-sm sm:text-base">
                    <SelectValue placeholder="Sortieren" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="amount-desc">Betrag ↓</SelectItem>
                    <SelectItem value="amount-asc">Betrag ↑</SelectItem>
                    <SelectItem value="count-desc">Anzahl ↓</SelectItem>
                    <SelectItem value="count-asc">Anzahl ↑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects List */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <AnimatePresence>
            {filteredAndSortedProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={fadeInUp}
                layout
              >
                <Card 
                  id={`project-${project.id}`}
                  className={`border-blue-100 rounded-3xl overflow-hidden hover:border-blue-300 transition-colors bg-white ${projectIdFromUrl === project.id.toString() ? "ring-2 ring-blue-500" : ""}`}
                >
                  <CardHeader className="p-8">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        {editingColorProjectId === project.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingColor}
                              onChange={(e) => setEditingColor(e.target.value)}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer border-2 border-blue-200"
                            />
                            <Button
                              size="sm"
                              onClick={saveColor}
                              disabled={updateProjectMutation.isPending}
                              className="text-white rounded-lg h-9 sm:h-10 text-sm sm:text-base"
                              style={{
                                background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                              }}
                            >
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingColorProjectId(null)}
                              className="border-blue-200 rounded-lg h-9 sm:h-10 text-sm sm:text-base"
                            >
                              Abbrechen
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleColorChange(project.id, project.color || "#000000")}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center group"
                            style={{ backgroundColor: project.color || "#000000" }}
                            title="Farbe ändern"
                          >
                            <Palette className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                        <div>
                          <CardTitle className="text-2xl font-light">{project.name}</CardTitle>
                          <CardDescription className="mt-2 text-gray-600 text-sm sm:text-base">
                            {project.invoices.length} Rechnung(en) · €{(project.totalAmount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadProjectMutation.mutate({ projectId: project.id })}
                          disabled={downloadProjectMutation.isPending || project.invoices.length === 0}
                          className="border-blue-200 text-gray-700 hover:bg-blue-600 hover:text-white rounded-lg text-sm sm:text-base"
                          title="Alle Rechnungen herunterladen"
                        >
                          {downloadProjectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FolderArchive className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={deleteProjectMutation.isPending}
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {project.invoices.length > 0 && (
                    <CardContent className="p-4 sm:p-8 pt-0">
                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-3">
                        {project.invoices.map((invoice) => (
                          <div key={invoice.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-base text-blue-600 flex-1">
                                {invoice.toolName || "—"}
                              </div>
                              <div className="text-right font-mono text-lg font-semibold text-gray-900 ml-3">
                                €{(convertToEUR(invoice.amount, invoice.currency) / 100).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {invoice.companyName || "—"}
                            </div>
                            <div className="mt-2">
                              <Badge variant="outline" className="border-blue-200 px-3 py-1 text-xs">
                                {invoice.month}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-blue-100">
                              <TableHead className="text-gray-600 font-medium text-base py-4">Tool</TableHead>
                              <TableHead className="text-gray-600 font-medium text-base py-4">Firma</TableHead>
                              <TableHead className="text-right text-gray-600 font-medium text-base py-4">Betrag</TableHead>
                              <TableHead className="text-gray-600 font-medium text-base py-4">Monat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {project.invoices.map((invoice) => (
                              <TableRow key={invoice.id} className="border-blue-100">
                                <TableCell className="font-medium text-base py-4">
                                  {invoice.toolName || "—"}
                                </TableCell>
                                <TableCell className="text-gray-700 text-base py-4">
                                  {invoice.companyName || "—"}
                                </TableCell>
                                <TableCell className="text-right font-mono text-base py-4">
                                  €{(convertToEUR(invoice.amount, invoice.currency) / 100).toFixed(2)}
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge variant="outline" className="border-blue-200 px-3 py-1 text-sm">
                                    {invoice.month}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Unassigned Invoices */}
          {filteredUnassigned.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card className="border-dashed border-2 border-blue-200 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-black/10" />
                    <div>
                      <CardTitle className="text-2xl font-light text-black/70">Nicht zugeordnet</CardTitle>
                      <CardDescription className="mt-2 text-black/40 text-base">
                        {unassignedInvoices.length} Rechnung(en) · €{(unassignedTotal / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-8 pt-0">
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {filteredUnassigned.map((invoice) => (
                      <div key={invoice.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-base text-gray-900 flex-1">
                            {invoice.toolName || "—"}
                          </div>
                          <div className="text-right font-mono text-lg font-semibold text-gray-900 ml-3">
                            €{(convertToEUR(invoice.amount, invoice.currency) / 100).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {invoice.companyName || "—"}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="border-gray-300 px-3 py-1 text-xs">
                            {invoice.month}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-blue-100">
                          <TableHead className="text-gray-600 font-medium text-base py-4">Tool</TableHead>
                          <TableHead className="text-gray-600 font-medium text-base py-4">Firma</TableHead>
                          <TableHead className="text-right text-gray-600 font-medium text-base py-4">Betrag</TableHead>
                          <TableHead className="text-gray-600 font-medium text-base py-4">Monat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUnassigned.map((invoice) => (
                          <TableRow key={invoice.id} className="border-blue-100">
                            <TableCell className="font-medium text-base py-4">
                              {invoice.toolName || "—"}
                            </TableCell>
                            <TableCell className="text-gray-700 text-base py-4">
                              {invoice.companyName || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-base py-4">
                              €{(convertToEUR(invoice.amount, invoice.currency) / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="outline" className="border-black/20 px-3 py-1">
                                {invoice.month}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {projects?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="text-center py-20 border-black/10 rounded-3xl">
              <CardContent>
                <FolderKanban className="h-20 w-20 mx-auto text-black/20 mb-6" strokeWidth={1} />
                <h3 className="text-2xl font-light mb-3">Noch keine Projekte</h3>
                <p className="text-black/40 mb-8 text-lg">
                  Erstellen Sie Ihr erstes Projekt zur Organisation
                </p>
                <Button 
                  onClick={() => setProjectDialogOpen(true)}
                  size="lg"
                  className="bg-black hover:bg-black/90 text-white rounded-xl px-8"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Projekt erstellen
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
