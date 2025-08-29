import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Download, 
  Copy, 
  Mail, 
  FileText, 
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCount: number;
}

interface EmailUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export function EmailExportModal({ isOpen, onClose, userCount }: EmailExportModalProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState("text");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch email list with current filters
  const { data: emailList, isLoading } = useQuery<EmailUser[]>({
    queryKey: ["/api/admin/users/emails", { format: "json", role: roleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("format", "json");
      if (roleFilter !== "all") params.append("role", roleFilter);
      
      const response = await fetch(`/api/admin/users/emails?${params.toString()}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Error fetching email list");
      return response.json();
    },
    enabled: isOpen,
  });

  const filteredEmails = emailList || [];
  const previewEmails = filteredEmails.slice(0, 10);

  // Copy emails to clipboard
  const copyEmailsToClipboard = async () => {
    if (!filteredEmails.length) return;
    
    let emailText = "";
    if (exportFormat === "text") {
      emailText = filteredEmails.map(user => user.email).join(", ");
    } else if (exportFormat === "csv") {
      emailText = [
        "Name,Email,Role,Registration Date",
        ...filteredEmails.map(user => 
          `"${user.name}","${user.email}","${user.role}","${user.createdAt}"`
        )
      ].join('\n');
    } else {
      emailText = JSON.stringify(filteredEmails, null, 2);
    }

    try {
      await navigator.clipboard.writeText(emailText);
      toast({
        title: "Emails copiados",
        description: `${filteredEmails.length} emails han sido copiados al portapapeles.`,
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudieron copiar los emails al portapapeles.",
        variant: "destructive",
      });
    }
  };

  // Download emails as file
  const downloadEmails = async () => {
    if (!filteredEmails.length) return;
    
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("format", exportFormat);
      if (roleFilter !== "all") params.append("role", roleFilter);
      
      const response = await fetch(`/api/admin/users/emails?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Error downloading emails");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-emails-${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Archivo descargado",
        description: `Se ha descargado el archivo con ${filteredEmails.length} emails.`,
      });
    } catch (error) {
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el archivo de emails.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "text": return <FileText className="w-4 h-4" />;
      case "csv": return <FileSpreadsheet className="w-4 h-4" />;
      case "json": return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case "text": return "Lista simple de emails separados por comas";
      case "csv": return "Archivo CSV con nombre, email, rol y fecha";
      case "json": return "Archivo JSON con datos completos";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Exportar Lista de Emails
          </DialogTitle>
          <DialogDescription>
            Exporta la lista de emails de usuarios registrados en diferentes formatos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato de Exportación</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon("text")}
                      <span>Texto Plano</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon("csv")}
                      <span>CSV</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon("json")}
                      <span>JSON</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {getFormatDescription(exportFormat)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Rol</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  <SelectItem value="ADMIN">Solo Administradores</SelectItem>
                  <SelectItem value="MONITOR">Solo Monitores</SelectItem>
                  <SelectItem value="USER">Solo Usuarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Total de emails:</span>
                  <Badge variant="outline">{filteredEmails.length}</Badge>
                </div>
                {roleFilter !== "all" && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Filtrado por rol</span>
                  </div>
                )}
              </div>
              {isLoading && <Skeleton className="h-4 w-20" />}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vista Previa (primeros 10 emails)</label>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-40 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : previewEmails.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay emails para mostrar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {previewEmails.map((user, index) => (
                    <div key={user.id} className="text-sm text-gray-700">
                      {exportFormat === "text" ? (
                        user.email
                      ) : exportFormat === "csv" ? (
                        `${user.name}, ${user.email}, ${user.role}`
                      ) : (
                        `${user.name} (${user.email}) - ${user.role}`
                      )}
                    </div>
                  ))}
                  {filteredEmails.length > 10 && (
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      ... y {filteredEmails.length - 10} emails más
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={copyEmailsToClipboard}
              disabled={!filteredEmails.length || isLoading}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar al Portapapeles
            </Button>
            <Button
              onClick={downloadEmails}
              disabled={!filteredEmails.length || isLoading || isExporting}
              variant="default"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Descargando..." : "Descargar Archivo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
