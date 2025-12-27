import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, History, Trash2, FileText, FileSpreadsheet, File, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function ExportHistoryPage() {
  const { data: exports, isLoading, refetch } = trpc.exportHistory.list.useQuery({ limit: 100 });
  const downloadMutation = trpc.exportHistory.download.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Export wird heruntergeladen");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
  const deleteMutation = trpc.exportHistory.delete.useMutation({
    onSuccess: () => {
      toast.success("Export gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const getExportIcon = (type: string) => {
    switch (type) {
      case "excel":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "datev":
        return <FileText className="h-5 w-5" />;
      case "pdf":
        return <File className="h-5 w-5" />;
      case "zip":
        return <File className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Lädt Export-Historie...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <History className="h-8 w-8" />
            Export-Historie
          </h1>
          <p className="text-gray-600">Alle Ihre erstellten Exporte</p>
        </div>

        {!exports || exports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 mb-2">Noch keine Exporte</p>
              <p className="text-sm text-gray-500">
                Ihre Exporte werden hier angezeigt, sobald Sie welche erstellen
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exports.map((exportItem) => (
              <Card key={exportItem.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 w-full sm:w-auto">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        {getExportIcon(exportItem.exportType)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{exportItem.fileName}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(exportItem.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                          </span>
                          <span>{formatFileSize(exportItem.fileSize)}</span>
                          {exportItem.invoiceCount > 0 && (
                            <span>{exportItem.invoiceCount} Rechnungen</span>
                          )}
                          {exportItem.month && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {exportItem.month}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadMutation.mutate({ id: exportItem.id })}
                        disabled={downloadMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Möchten Sie diesen Export wirklich löschen?")) {
                            deleteMutation.mutate({ id: exportItem.id });
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

