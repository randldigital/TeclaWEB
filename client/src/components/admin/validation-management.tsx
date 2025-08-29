import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, QrCode, Settings, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeeklyCode {
  code: string;
  validFrom: string;
  validTo: string;
}

export function ValidationManagement() {
  const { toast } = useToast();
  const [weeklyCode, setWeeklyCode] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  // Fetch current weekly code
  const { data: currentCode, refetch, isLoading } = useQuery<WeeklyCode>({
    queryKey: ["/api/admin/weekly-code"],
    queryFn: async () => {
      const response = await fetch("/api/admin/weekly-code", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch weekly code");
      }
      return response.json();
    },
  });

  // Update weekly code mutation
  const updateCodeMutation = useMutation({
    mutationFn: async (data: { code: string; validFrom: string; validTo: string }) => {
      const response = await fetch("/api/admin/weekly-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update weekly code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Código actualizado",
        description: "El código semanal ha sido actualizado correctamente.",
      });
      refetch();
      // Reset form
      setWeeklyCode('');
      setValidFrom('');
      setValidTo('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyCode || !validFrom || !validTo) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    updateCodeMutation.mutate({ code: weeklyCode, validFrom, validTo });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCodeActive = () => {
    if (!currentCode) return false;
    const now = new Date();
    const from = new Date(currentCode.validFrom);
    const to = new Date(currentCode.validTo);
    return now >= from && now <= to;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Gestión de Validación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Weekly Code Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Código Semanal Actual</h3>
          
          {isLoading ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : currentCode ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-800">
                  <strong>Código:</strong> {currentCode.code}
                </p>
                <Badge 
                  variant={isCodeActive() ? "default" : "destructive"}
                  className={isCodeActive() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {isCodeActive() ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-blue-800">
                <strong>Válido desde:</strong> {formatDate(currentCode.validFrom)}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Válido hasta:</strong> {formatDate(currentCode.validTo)}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No hay código semanal configurado. Crea uno nuevo.
              </p>
            </div>
          )}
        </div>

        {/* Update Weekly Code Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Actualizar Código Semanal</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weeklyCode">Código (5 dígitos)</Label>
                <Input
                  id="weeklyCode"
                  value={weeklyCode}
                  onChange={(e) => setWeeklyCode(e.target.value)}
                  maxLength={5}
                  placeholder="12345"
                  required
                />
              </div>
              <div>
                <Label htmlFor="validFrom">Válido desde</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="validTo">Válido hasta</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit"
                disabled={updateCodeMutation.isPending}
                className="gap-2"
              >
                {updateCodeMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {updateCodeMutation.isPending ? 'Actualizando...' : 'Actualizar Código'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => window.open('/validacion', '_blank')}
              className="gap-2"
            >
              <QrCode className="w-4 h-4" />
              Abrir Validación
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/qr-validator', '_blank')}
              className="gap-2"
            >
              <QrCode className="w-4 h-4" />
              Validación Manual
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
