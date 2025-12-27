import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Settings, User, Mail, Download, Save, Edit2, Check, X, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { theme } from "@/theme";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const { data: userSettings, isLoading: settingsLoading, refetch: refetchSettings } = trpc.settings.get.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Einstellungen gespeichert");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
  const updateProfileMutation = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil aktualisiert");
      refresh();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [originalName, setOriginalName] = useState(user?.user_metadata?.name || "");
  const [defaultExchangeRate, setDefaultExchangeRate] = useState("1.0");
  const [defaultExportFormat, setDefaultExportFormat] = useState<"excel" | "datev" | "pdf">("excel");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Update local state when user or settings load
  useEffect(() => {
    if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
      setOriginalName(user.user_metadata.name);
    }
  }, [user]);

  useEffect(() => {
    if (userSettings) {
      setDefaultExchangeRate(userSettings.defaultExchangeRate || "1.0");
      setDefaultExportFormat((userSettings.defaultExportFormat as "excel" | "datev" | "pdf") || "excel");
      setEmailNotifications(userSettings.emailNotifications ?? true);
    }
  }, [userSettings]);

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      defaultExchangeRate,
      defaultExportFormat,
      emailNotifications,
    });
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }
    updateProfileMutation.mutate({ name: name.trim() }, {
      onSuccess: () => {
        setIsEditingProfile(false);
        setOriginalName(name.trim());
      }
    });
  };

  const handleCancelEdit = () => {
    setName(originalName);
    setIsEditingProfile(false);
  };

  if (settingsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Lädt Einstellungen...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Einstellungen
          </h1>
          <p className="text-gray-600">Verwalten Sie Ihre Kontoeinstellungen und Präferenzen</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="border-blue-100 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                        boxShadow: theme.shadows.md,
                      }}
                    >
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Profil
                  </CardTitle>
                  <CardDescription className="mt-2">Ihre persönlichen Informationen</CardDescription>
                </div>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    className="border-blue-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar/Profile Picture Placeholder */}
              <div className="flex items-center gap-4 pb-4 border-b border-blue-100">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                    boxShadow: theme.shadows.md,
                  }}
                >
                  {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Profilbild</p>
                  <p className="text-xs text-gray-400">Initialen werden automatisch generiert</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-blue-50 border-blue-200 text-gray-600"
                  />
                  <p className="text-xs text-gray-500">E-Mail kann nicht geändert werden</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Name</Label>
                  <AnimatePresence mode="wait">
                    {isEditingProfile ? (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                      >
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ihr Name"
                          className="border-blue-200 focus:border-blue-500 h-12 rounded-xl"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending || !name.trim() || name.trim() === originalName}
                            className="text-white rounded-xl px-6"
                            style={{
                              background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                              boxShadow: theme.shadows.md,
                            }}
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Speichern...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Speichern
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateProfileMutation.isPending}
                            className="border-blue-200 text-gray-700 hover:bg-blue-50 rounded-xl"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Abbrechen
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100"
                      >
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Aktueller Name</p>
                          <p className="text-base font-medium text-gray-900">
                            {name || user?.email?.split('@')[0] || "Nicht gesetzt"}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card className="border-blue-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export-Einstellungen
              </CardTitle>
              <CardDescription>Standard-Einstellungen für Exporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Standard-Wechselkurs (USD → EUR)</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  value={defaultExchangeRate}
                  onChange={(e) => setDefaultExchangeRate(e.target.value)}
                  placeholder="0.92"
                />
                <p className="text-sm text-gray-500">Wird für Excel-Exporte verwendet</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Standard-Export-Format</Label>
                <Select value={defaultExportFormat} onValueChange={(value: "excel" | "datev" | "pdf") => setDefaultExportFormat(value)}>
                  <SelectTrigger id="exportFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="datev">DATEV (.csv)</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="w-full sm:w-auto text-white rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                  boxShadow: theme.shadows.md,
                }}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Einstellungen speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-blue-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>E-Mail-Benachrichtigungen verwalten</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">
                    Erhalten Sie E-Mails bei wichtigen Ereignissen
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="w-full sm:w-auto text-white rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.lightBlue} 100%)`,
                  boxShadow: theme.shadows.md,
                }}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Einstellungen speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

