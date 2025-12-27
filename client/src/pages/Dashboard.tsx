import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { FileUp, LogOut, Receipt, Calendar, TrendingUp, FolderKanban, Plus, Upload, CloudUpload, Sparkles, Loader2, Search, X, Users, BarChart3, Settings, Home, ChevronRight, PanelRightOpen, PanelRightClose, User } from "lucide-react";
import { theme as appTheme } from "@/theme";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#000000");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: invoices, refetch } = trpc.invoices.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: projects, refetch: refetchProjects } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: searchResults } = trpc.invoices.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length >= 2, retry: false }
  );

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

  const assignProjectMutation = trpc.projects.assignInvoice.useMutation({
    onSuccess: () => {
      toast.success("Projekt zugewiesen");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const uploadMutation = trpc.invoices.upload.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler beim Hochladen: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, loading, setLocation]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name}: Nur PDF-Dateien erlaubt`);
        continue;
      }
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`${file.name}: Datei zu groß (max. 16MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const file of validFiles) {
        try {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          const invoice = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64,
            fileSize: file.size,
            fileType: file.type,
          });

          if (selectedProjectId !== "none") {
            await assignProjectMutation.mutateAsync({
              invoiceId: invoice.id,
              projectId: parseInt(selectedProjectId),
            });
          }
          successCount++;
        } catch (error: any) {
          console.error(`Error uploading ${file.name}:`, error);
          let errorMessage = error?.message || error?.data?.message || String(error);
          
          // Better error messages for common issues
          if (errorMessage.includes('Circuit breaker') || errorMessage.includes('authentication')) {
            errorMessage = 'Datenbank-Verbindung temporär blockiert. Bitte in 2-3 Minuten erneut versuchen.';
          } else if (errorMessage.includes('Failed query')) {
            errorMessage = 'Datenbank-Fehler. Bitte später erneut versuchen.';
          }
          
          toast.error(`${file.name}: ${errorMessage}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} Rechnung(en) erfolgreich hochgeladen`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} Rechnung(en) fehlgeschlagen`);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedProjectId, uploadMutation, assignProjectMutation]);

  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Nur PDF und Bilder erlaubt`);
        continue;
      }
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`${file.name}: Datei zu groß (max. 16MB)`);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} Datei(en) ausgewählt`);
    }
    e.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Bitte wählen Sie zuerst Dateien aus");
      return;
    }
    await processFiles(selectedFiles);
    setSelectedFiles([]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      
      for (const file of fileArray) {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast.error(`${file.name}: Nur PDF und Bilder erlaubt`);
          continue;
        }
        if (file.size > 16 * 1024 * 1024) {
          toast.error(`${file.name}: Datei zu groß (max. 16MB)`);
          continue;
        }
        validFiles.push(file);
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} Datei(en) ausgewählt`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: appTheme.colors.bgGradient }}>
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

  // Group invoices by month
  const invoicesByMonth = invoices?.reduce((acc, invoice) => {
    if (!acc[invoice.month]) {
      acc[invoice.month] = [];
    }
    acc[invoice.month].push(invoice);
    return acc;
  }, {} as Record<string, typeof invoices>);

  const months = Object.keys(invoicesByMonth || {}).sort().reverse();

  // Calculate totals
  const totalInvoices = invoices?.length || 0;
  const totalAmount = invoices?.reduce((sum, inv) => {
    const amountInEUR = inv.currency === "EUR" ? inv.amount : Math.round(inv.amount * 0.92);
    return sum + amountInEUR;
  }, 0) || 0;

  return (
    <div className="min-h-screen" style={{ background: appTheme.colors.bgGradient }}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
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
                    background: `linear-gradient(135deg, ${appTheme.colors.blue} 0%, ${appTheme.colors.lightBlue} 100%)`,
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
                  background: `linear-gradient(135deg, ${appTheme.colors.blue} 0%, ${appTheme.colors.lightBlue} 100%)`,
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
                  <Users className="h-5 w-5" style={{ color: appTheme.colors.blue }} />
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

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-blue-100"
        >
          <div className="px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${appTheme.colors.blue} 0%, ${appTheme.colors.lightBlue} 100%)`,
                }}
              >
                <Receipt className="h-5 w-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <span className="font-medium text-gray-900">{APP_TITLE}</span>
                <p className="text-xs text-gray-500">Rechnungsverwaltung</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md mx-6 hidden md:block">
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2.5">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechnungen durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(e.target.value.length >= 2);
                  }}
                  onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                  className="bg-transparent border-none outline-none flex-1 text-sm text-gray-900 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }}>
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchOpen && searchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-white border border-blue-100 rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
                  >
                    {searchResults.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => {
                          setLocation(`/month/${inv.month}`);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-blue-100 last:border-0"
                      >
                        <div className="font-medium text-sm text-gray-900">{inv.toolName || inv.fileName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{inv.companyName || '—'}</span>
                          <span>•</span>
                          <span>€{(inv.amount / 100).toFixed(2)}</span>
                          <span>•</span>
                          <span>{inv.month}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden lg:block">{user?.email}</span>
              
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

        <div className="px-6 py-8 max-w-6xl mx-auto">
          {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <Card 
            className="border-0 text-white rounded-xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${appTheme.colors.blue} 0%, ${appTheme.colors.lightBlue} 100%)`,
              boxShadow: appTheme.shadows.sm,
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs mb-1">Gesamtausgaben</p>
                  <p className="text-2xl font-medium">€{(totalAmount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100 rounded-xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Rechnungen</p>
                  <p className="text-2xl font-medium text-gray-900">{totalInvoices}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Receipt className="h-5 w-5" style={{ color: appTheme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100 rounded-xl overflow-hidden hover:border-blue-300 transition-colors bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Projekte</p>
                  <p className="text-2xl font-medium text-gray-900">{projects?.length || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FolderKanban className="h-5 w-5" style={{ color: appTheme.colors.blue }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          {/* Ausgewählte Dateien anzeigen */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{selectedFiles.length} Datei(en) ausgewählt</span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg text-sm border border-blue-100">
                    <span className="truncate flex-1 text-gray-900">{file.name}</span>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="ml-3 text-red-500 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {/* Datei auswählen */}
            <label className="cursor-pointer">
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                multiple
                className="hidden"
              />
              <Button 
                size="sm" 
                variant="outline"
                className="w-full h-12 border-2 border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  borderColor: appTheme.colors.blue + '40',
                }}
                disabled={uploading}
                asChild
              >
                <span>
                  <FileUp className="h-4 w-4" />
                  Dateien
                </span>
              </Button>
            </label>
            
            {/* Projekt Auswahl */}
            {projects && projects.length > 0 ? (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger 
                  size="default"
                  className="!h-12 !min-h-[3rem] !max-h-[3rem] w-full !px-4 !py-0 rounded-xl bg-white border-2 border-blue-200 text-gray-900 text-sm font-medium hover:border-blue-400 transition-all flex items-center justify-between [&[data-size=default]]:!h-12 [&[data-size=sm]]:!h-12"
                >
                  <SelectValue placeholder="Projekt" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Kein Projekt</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color || "#000000" }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                onClick={() => initializeDefaultsMutation.mutate()}
                disabled={initializeDefaultsMutation.isPending}
                variant="outline"
                className="w-full h-12 border-2 border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-medium"
              >
                + Projekte
              </Button>
            )}
            
            {/* Hochladen Button (schwarz) */}
            <Button
              onClick={handleUploadConfirm}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full h-12 text-white disabled:bg-gray-200 disabled:text-gray-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${appTheme.colors.blue} 0%, ${appTheme.colors.lightBlue} 100%)`,
              }}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Hochladen
                </>
              )}
            </Button>
            
            {/* Neues Projekt */}
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2 border-blue-200 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Projekt hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-blue-100 p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-medium text-gray-900">Neues Projekt</DialogTitle>
                  <DialogDescription className="text-gray-600 text-base">
                    Erstellen Sie ein Projekt zur Organisation Ihrer Rechnungen
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
                      className="h-14 rounded-xl border-blue-200 text-base"
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
                        className="w-20 h-14 p-2 rounded-xl border-blue-200"
                      />
                      <Input
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 h-14 rounded-xl border-blue-200"
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
                    className="text-white h-14 px-8 rounded-xl text-base"
                    style={{
                      background: `linear-gradient(135deg, ${appTheme.colors.blue} 0%, ${appTheme.colors.lightBlue} 100%)`,
                    }}
                  >
                    Projekt erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-3">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              Wird verarbeitet...
            </div>
          )}
        </motion.div>

        {/* Projects & Navigation */}
        <AnimatePresence>
          {projects && projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-medium text-gray-900">Ihre Projekte</h2>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/analytics")}
                    className="rounded-xl border-blue-200 hover:bg-blue-600 hover:text-white h-12 px-6"
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Analyse
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/projects")}
                    className="rounded-xl border-blue-200 hover:bg-blue-600 hover:text-white h-12 px-6"
                  >
                    Alle Projekte
                  </Button>
                </div>
              </div>
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {projects.map((project) => {
                  const projectInvoices = invoices?.filter((inv) => inv.projectId === project.id) || [];
                  const totalAmount = projectInvoices.reduce((sum, inv) => {
                    const amountInEUR = inv.currency === "EUR" ? inv.amount : Math.round(inv.amount * 0.92);
                    return sum + amountInEUR;
                  }, 0);
                  // Weiße Farben durch Schwarz ersetzen für bessere Sichtbarkeit
                  const displayColor = project.color?.toLowerCase() === "#ffffff" || project.color?.toLowerCase() === "#fff" 
                    ? "#000000" 
                    : (project.color || "#000000");

                  return (
                    <motion.div
                      key={project.id}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => setLocation(`/projects?project=${project.id}`)}
                    >
                      <Card className="border-blue-100 rounded-2xl hover:border-blue-300 transition-all h-full bg-white">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-xl flex-shrink-0"
                              style={{ backgroundColor: displayColor }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-lg text-gray-900 truncate">{project.name}</h3>
                              <p className="text-gray-600 text-base mt-1">
                                {projectInvoices.length} Rechnungen
                              </p>
                              <p className="text-gray-900 font-medium text-xl mt-2">
                                €{(totalAmount / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6" style={{ color: appTheme.colors.blue }} />
            </div>
            <h2 className="text-2xl font-medium text-gray-900">Monatliche Übersicht</h2>
          </div>

          {months.length === 0 ? (
            <Card className="border-blue-100 rounded-3xl bg-white">
              <CardContent className="py-20 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Receipt className="h-10 w-10" style={{ color: appTheme.colors.blue + '60' }} />
                </div>
                <h3 className="text-2xl font-medium text-gray-700 mb-3">Noch keine Rechnungen</h3>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                  Laden Sie Ihre erste Rechnung hoch, um mit der Verwaltung zu beginnen.
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-4"
            >
              {months.map((month) => {
                const monthInvoices = invoicesByMonth![month]!;
                const totalUSD = monthInvoices
                  .filter((inv: typeof monthInvoices[0]) => inv.currency === "USD")
                  .reduce((sum: number, inv: typeof monthInvoices[0]) => sum + inv.amount, 0);
                const totalEUR = monthInvoices
                  .filter((inv: typeof monthInvoices[0]) => inv.currency === "EUR")
                  .reduce((sum: number, inv: typeof monthInvoices[0]) => sum + inv.amount, 0);
                
                const exchangeRate = 0.92;
                const totalInEUR = Math.round(totalUSD * exchangeRate) + totalEUR;

                const monthName = new Date(month + "-01").toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                });

                return (
                  <motion.div key={month} variants={fadeInUp}>
                    <Card
                      className="border-blue-100 hover:border-blue-300 cursor-pointer transition-all duration-300 group rounded-2xl overflow-hidden bg-white"
                      onClick={() => setLocation(`/month/${month}`)}
                    >
                      <CardContent className="p-8">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-6">
                            <div 
                              className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center transition-colors"
                            >
                              <Calendar className="h-8 w-8" style={{ color: appTheme.colors.blue }} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-medium text-gray-900 group-hover:translate-x-2 transition-transform">
                                {monthName}
                              </h3>
                              <p className="text-lg text-gray-600 mt-1">
                                {monthInvoices.length} Rechnung{monthInvoices.length !== 1 ? 'en' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Gesamt</p>
                            <p className="text-3xl font-medium text-gray-900">
                              €{(totalInEUR / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}
