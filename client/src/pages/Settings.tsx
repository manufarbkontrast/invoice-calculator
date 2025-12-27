import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Settings, User, Mail, Download, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: userSettings, isLoading: settingsLoading } = trpc.settings.get.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Einstellungen gespeichert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
  const updateProfileMutation = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil aktualisiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [defaultExchangeRate, setDefaultExchangeRate] = useState("1.0");
  const [defaultExportFormat, setDefaultExportFormat] = useState<"excel" | "datev" | "pdf">("excel");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Update local state when settings load
  useState(() => {
    if (userSettings) {
      setDefaultExchangeRate(userSettings.defaultExchangeRate || "1.0");
      setDefaultExportFormat((userSettings.defaultExportFormat as "excel" | "datev" | "pdf") || "excel");
      setEmailNotifications(userSettings.emailNotifications ?? true);
    }
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      defaultExchangeRate,
      defaultExportFormat,
      emailNotifications,
    });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ name });
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil
              </CardTitle>
              <CardDescription>Ihre persönlichen Informationen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">E-Mail kann nicht geändert werden</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ihr Name"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Profil speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card>
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
                className="w-full sm:w-auto"
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
          <Card>
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
                className="w-full sm:w-auto"
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

