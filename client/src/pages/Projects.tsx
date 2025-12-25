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
          <div className="w-16 h-16 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          <span className="text-xl text-black/50">Lädt...</span>
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
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5"
      >
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-black">{APP_TITLE}</h1>
              <p className="text-sm text-black/40">Rechnungsverwaltung</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-base text-black/60">{user?.email}</span>
            <Button 
              variant="outline" 
              size="lg"
              onClick={logout}
              className="border-black/20 text-black hover:bg-black hover:text-white transition-all duration-300 rounded-xl px-6"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </motion.header>

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
              className="border-black/20 text-black hover:bg-black hover:text-white transition-all rounded-xl"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Zurück
            </Button>
            <div>
              <h2 className="text-4xl font-light text-black flex items-center gap-3">
                <FolderKanban className="h-10 w-10" strokeWidth={1.5} />
                Projekte
              </h2>
              <p className="text-lg text-black/50 mt-1">Verwalten Sie Ihre Projekte</p>
            </div>
          </div>

          <div className="flex gap-3">
            {(!projects || projects.length === 0) && (
              <Button 
                onClick={() => initializeDefaultsMutation.mutate()}
                disabled={initializeDefaultsMutation.isPending}
                size="lg"
                variant="outline"
                className="border-black/20 text-black hover:bg-black hover:text-white rounded-xl px-6"
              >
                {initializeDefaultsMutation.isPending ? "Wird hinzugefügt..." : "Standard-Projekte"}
              </Button>
            )}
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-black hover:bg-black/90 text-white rounded-xl px-8">
                  <Plus className="h-5 w-5 mr-2" />
                  Neues Projekt
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-black/10 p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-medium">Neues Projekt</DialogTitle>
                  <DialogDescription className="text-black/50 text-base">
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
                      className="h-14 rounded-xl border-black/20 text-base"
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
                        className="w-20 h-14 p-2 rounded-xl border-black/20"
                      />
                      <Input
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 h-14 rounded-xl border-black/20 text-base"
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
                    className="bg-black hover:bg-black/90 text-white rounded-xl px-8"
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
          <Card className="border-0 bg-black text-white rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-lg mb-2">Gesamt zugeordnet</p>
                  <p className="text-5xl font-light">€{(totalProjectAmount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-black/10 rounded-3xl overflow-hidden hover:border-black/30 transition-colors">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black/50 text-lg mb-2">Projekte</p>
                  <p className="text-5xl font-light text-black">{projects?.length || 0}</p>
                </div>
                <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center">
                  <FolderKanban className="h-8 w-8 text-black/60" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-black/10 rounded-3xl overflow-hidden hover:border-black/30 transition-colors">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-black/50 text-lg mb-2">Nicht zugeordnet</p>
                  <p className="text-5xl font-light text-black">{unassignedInvoices.length}</p>
                </div>
                <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center">
                  <FileText className="h-8 w-8 text-black/60" />
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
          <Card className="border-black/10 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black/30" />
                  <Input
                    placeholder="Projekte durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 border-black/20 focus:border-black rounded-xl text-base"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[220px] h-14 border-black/20 rounded-xl">
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
                  className={`border-black/10 rounded-3xl overflow-hidden hover:border-black/30 transition-colors ${projectIdFromUrl === project.id.toString() ? "ring-2 ring-black" : ""}`}
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
                              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-black/10"
                            />
                            <Button
                              size="sm"
                              onClick={saveColor}
                              disabled={updateProjectMutation.isPending}
                              className="bg-black hover:bg-black/90 text-white rounded-lg h-10"
                            >
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingColorProjectId(null)}
                              className="border-black/20 rounded-lg h-10"
                            >
                              Abbrechen
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleColorChange(project.id, project.color || "#000000")}
                            className="w-8 h-8 rounded-full border-2 border-black/10 hover:border-black/30 transition-colors cursor-pointer flex items-center justify-center group"
                            style={{ backgroundColor: project.color || "#000000" }}
                            title="Farbe ändern"
                          >
                            <Palette className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        )}
                        <div>
                          <CardTitle className="text-2xl font-light">{project.name}</CardTitle>
                          <CardDescription className="mt-2 text-black/40 text-base">
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
                          className="border-black/20 text-black hover:bg-black hover:text-white rounded-lg"
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
                    <CardContent className="p-8 pt-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-black/10">
                              <TableHead className="text-black/50 font-medium text-base py-4">Tool</TableHead>
                              <TableHead className="text-black/50 font-medium text-base py-4">Firma</TableHead>
                              <TableHead className="text-right text-black/50 font-medium text-base py-4">Betrag</TableHead>
                              <TableHead className="text-black/50 font-medium text-base py-4">Monat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {project.invoices.map((invoice) => (
                              <TableRow key={invoice.id} className="border-black/5">
                                <TableCell className="font-medium text-base py-4">
                                  {invoice.toolName || "—"}
                                </TableCell>
                                <TableCell className="text-black/60 text-base py-4">
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
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Unassigned Invoices */}
          {filteredUnassigned.length > 0 && (
            <motion.div variants={fadeInUp}>
              <Card className="border-dashed border-2 border-black/20 rounded-3xl overflow-hidden">
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
                <CardContent className="p-8 pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-black/10">
                          <TableHead className="text-black/50 font-medium text-base py-4">Tool</TableHead>
                          <TableHead className="text-black/50 font-medium text-base py-4">Firma</TableHead>
                          <TableHead className="text-right text-black/50 font-medium text-base py-4">Betrag</TableHead>
                          <TableHead className="text-black/50 font-medium text-base py-4">Monat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUnassigned.map((invoice) => (
                          <TableRow key={invoice.id} className="border-black/5">
                            <TableCell className="font-medium text-base py-4">
                              {invoice.toolName || "—"}
                            </TableCell>
                            <TableCell className="text-black/60 text-base py-4">
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
