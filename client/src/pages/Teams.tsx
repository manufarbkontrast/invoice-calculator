import { useAuth } from "@/_core/hooks/useAuth";
import { theme } from "@/theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import {
  ArrowLeft,
  Receipt,
  LogOut,
  Users,
  Plus,
  UserPlus,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  Copy,
  Check,
  Mail,
  Loader2,
  PanelRightOpen,
  X,
  Home,
  BarChart3,
  FolderKanban,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleLabels = {
  owner: "Besitzer",
  admin: "Admin",
  member: "Mitglied",
  viewer: "Betrachter",
};

const roleColors = {
  owner: "bg-yellow-100 text-yellow-700",
  admin: "bg-purple-100 text-purple-700",
  member: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-700",
};

export default function Teams() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: teams, refetch: refetchTeams } = trpc.teams.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: teamMembers, refetch: refetchMembers } = trpc.teams.members.useQuery(
    { teamId: selectedTeamId! },
    {
      enabled: isAuthenticated && selectedTeamId !== null,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Team erstellt");
      setCreateDialogOpen(false);
      setNewTeamName("");
      refetchTeams();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const inviteMemberMutation = trpc.teams.invite.useMutation({
    onSuccess: (data) => {
      toast.success("Einladung gesendet");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      // Copy link to clipboard
      const link = `${window.location.origin}${data.inviteLink}`;
      navigator.clipboard.writeText(link);
      toast.success("Einladungslink kopiert!");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const removeMemberMutation = trpc.teams.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Mitglied entfernt");
      refetchMembers();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

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

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const canManageTeam = selectedTeam?.role === "owner" || selectedTeam?.role === "admin";

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
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-gray-900">{APP_TITLE}</h1>
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 transition-all"
              >
                <FolderKanban className="h-5 w-5" />
                <span>Projekte</span>
              </button>

              <button
                onClick={() => { setLocation("/teams"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                }}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Teams</span>
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

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
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
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: theme.colors.blue }} strokeWidth={1.5} />
                Teams
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mt-1">Verwalten Sie Ihre Teams</p>
            </div>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                Neues Team
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Neues Team erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie ein Team, um Rechnungen mit Kollegen zu teilen.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="z.B. Marketing Team"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createTeamMutation.mutate({ name: newTeamName })}
                  disabled={!newTeamName.trim() || createTeamMutation.isPending}
                  className="text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  {createTeamMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Teams Grid */}
        {teams && teams.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Teams List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-1"
            >
              <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-xl font-light">Ihre Teams</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {teams.map((team) => {
                    const RoleIcon = roleIcons[team.role as keyof typeof roleIcons] || User;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`w-full p-3 sm:p-4 rounded-xl text-left transition-all ${
                          selectedTeamId === team.id 
                            ? "text-white" 
                            : "bg-blue-50 hover:bg-blue-100"
                        }`}
                        style={selectedTeamId === team.id ? {
                          background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                          boxShadow: theme.shadows.md,
                        } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedTeamId === team.id ? "bg-white/20" : "bg-blue-50"
                            }`}>
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className={`text-sm ${selectedTeamId === team.id ? "text-white/90" : "text-gray-600"}`}>
                                {roleLabels[team.role as keyof typeof roleLabels]}
                              </p>
                            </div>
                          </div>
                          <RoleIcon className={`h-5 w-5 ${selectedTeamId === team.id ? "text-white/90" : "text-gray-500"}`} />
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Team Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2"
            >
              {selectedTeam ? (
                <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-light">{selectedTeam.name}</CardTitle>
                        <CardDescription className="text-gray-600 text-sm sm:text-base mt-1">
                          Team-Mitglieder verwalten
                        </CardDescription>
                      </div>
                      {canManageTeam && (
                        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.md,
                  }}
                            >
                              <UserPlus className="h-5 w-5 mr-2" />
                              Einladen
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Mitglied einladen</DialogTitle>
                              <DialogDescription>
                                Senden Sie eine Einladung per E-Mail.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="inviteEmail">E-Mail Adresse</Label>
                                <Input
                                  id="inviteEmail"
                                  type="email"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="kollege@firma.de"
                                  className="h-12 rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Rolle</Label>
                                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                                  <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem value="admin">
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Admin
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="member">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Mitglied
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                      <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Betrachter
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => inviteMemberMutation.mutate({
                                  teamId: selectedTeamId!,
                                  email: inviteEmail,
                                  role: inviteRole,
                                })}
                                disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                                className="text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.md,
                  }}
                              >
                                {inviteMemberMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-2" />
                                )}
                                Einladung senden
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-4">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {teamMembers?.map((member) => {
                          const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User;
                          return (
                            <motion.div
                              key={member.id}
                              variants={fadeInUp}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-xl"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                  <User className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.colors.blue }} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm sm:text-base">{member.userId}</p>
                                  <Badge className={`mt-1 ${roleColors[member.role as keyof typeof roleColors]}`}>
                                    <RoleIcon className="h-3 w-3 mr-1" />
                                    {roleLabels[member.role as keyof typeof roleLabels]}
                                  </Badge>
                                </div>
                              </div>
                              {canManageTeam && member.role !== "owner" && member.userId !== user?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMemberMutation.mutate({
                                    teamId: selectedTeamId!,
                                    userId: member.userId,
                                  })}
                                  disabled={removeMemberMutation.isPending}
                                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {(!teamMembers || teamMembers.length === 0) && (
                        <div className="text-center py-12">
                          <Users className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4" style={{ color: theme.colors.blue + '40' }} strokeWidth={1} />
                          <p className="text-gray-600 text-sm sm:text-base">Keine Mitglieder gefunden</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-12 text-center">
                    <Users className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-6" style={{ color: theme.colors.blue + '40' }} strokeWidth={1} />
                    <p className="text-lg sm:text-xl text-gray-600">Wählen Sie ein Team aus</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-100 rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-16 text-center">
                <Users className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-6" style={{ color: theme.colors.blue + '40' }} strokeWidth={1} />
                <h3 className="text-xl sm:text-2xl font-light mb-3 text-gray-900">Noch keine Teams</h3>
                <p className="text-gray-600 mb-8 text-base sm:text-lg max-w-md mx-auto">
                  Erstellen Sie ein Team, um Rechnungen mit Kollegen zu teilen und gemeinsam zu verwalten.
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  size="lg"
                  className="text-white rounded-xl px-6 sm:px-8 text-sm sm:text-base"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                  boxShadow: theme.shadows.md,
                }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Erstes Team erstellen
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}


