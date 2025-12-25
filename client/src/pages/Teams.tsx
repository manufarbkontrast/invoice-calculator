import { useAuth } from "@/_core/hooks/useAuth";
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

  if (!isAuthenticated) {
    return null;
  }

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const canManageTeam = selectedTeam?.role === "owner" || selectedTeam?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
                <Users className="h-10 w-10" strokeWidth={1.5} />
                Teams
              </h2>
              <p className="text-lg text-black/50 mt-1">Verwalten Sie Ihre Teams</p>
            </div>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-black hover:bg-black/90 text-white rounded-xl px-8"
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
                  className="bg-black hover:bg-black/90 text-white rounded-xl px-6"
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
              <Card className="border-black/10 rounded-3xl overflow-hidden">
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
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          selectedTeamId === team.id 
                            ? "bg-black text-white" 
                            : "bg-black/5 hover:bg-black/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedTeamId === team.id ? "bg-white/20" : "bg-black/10"
                            }`}>
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className={`text-sm ${selectedTeamId === team.id ? "text-white/60" : "text-black/40"}`}>
                                {roleLabels[team.role as keyof typeof roleLabels]}
                              </p>
                            </div>
                          </div>
                          <RoleIcon className={`h-5 w-5 ${selectedTeamId === team.id ? "text-white/60" : "text-black/40"}`} />
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
                <Card className="border-black/10 rounded-3xl overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-light">{selectedTeam.name}</CardTitle>
                        <CardDescription className="text-black/40 text-base mt-1">
                          Team-Mitglieder verwalten
                        </CardDescription>
                      </div>
                      {canManageTeam && (
                        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="bg-black hover:bg-black/90 text-white rounded-xl px-6"
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
                                className="bg-black hover:bg-black/90 text-white rounded-xl px-6"
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
                              className="flex items-center justify-between p-4 bg-black/5 rounded-xl"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                                  <User className="h-6 w-6 text-black/60" />
                                </div>
                                <div>
                                  <p className="font-medium text-black">{member.userId}</p>
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
                          <Users className="h-16 w-16 mx-auto text-black/20 mb-4" strokeWidth={1} />
                          <p className="text-black/40">Keine Mitglieder gefunden</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-black/10 rounded-3xl overflow-hidden">
                  <CardContent className="p-12 text-center">
                    <Users className="h-20 w-20 mx-auto text-black/20 mb-6" strokeWidth={1} />
                    <p className="text-xl text-black/40">Wählen Sie ein Team aus</p>
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
            <Card className="border-black/10 rounded-3xl overflow-hidden">
              <CardContent className="p-16 text-center">
                <Users className="h-24 w-24 mx-auto text-black/20 mb-6" strokeWidth={1} />
                <h3 className="text-2xl font-light mb-3">Noch keine Teams</h3>
                <p className="text-black/40 mb-8 text-lg max-w-md mx-auto">
                  Erstellen Sie ein Team, um Rechnungen mit Kollegen zu teilen und gemeinsam zu verwalten.
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  size="lg"
                  className="bg-black hover:bg-black/90 text-white rounded-xl px-8"
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


