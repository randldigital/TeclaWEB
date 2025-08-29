import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Ticket, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface ValidationStats {
  totalValidations: number;
  todayValidations: number;
  weeklyValidations: number;
  monthlyValidations: number;
  activeWeeklyCode: string;
  lastValidation: string;
  validationRate: number;
}

export function ValidationStats() {
  const { data: stats, isLoading, error } = useQuery<ValidationStats>({
    queryKey: ["/api/admin/validation-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/validation-stats", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch validation stats");
      }
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estadísticas de Validación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estadísticas de Validación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Error al cargar las estadísticas: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estadísticas de Validación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Validations */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Validaciones</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.totalValidations || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Today's Validations */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Hoy</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats?.todayValidations || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Validations */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Esta Semana</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats?.weeklyValidations || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Validations */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Este Mes</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats?.monthlyValidations || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Active Weekly Code */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Código Activo</p>
              </div>
              {stats?.activeWeeklyCode ? (
                <Badge variant="outline" className="text-lg font-mono">
                  {stats.activeWeeklyCode}
                </Badge>
              ) : (
                <p className="text-sm text-gray-500">No hay código activo</p>
              )}
            </CardContent>
          </Card>

          {/* Last Validation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Última Validación</p>
              </div>
              {stats?.lastValidation ? (
                <p className="text-sm text-gray-600">
                  {formatDate(stats.lastValidation)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Ninguna</p>
              )}
            </CardContent>
          </Card>

          {/* Validation Rate */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Tasa de Éxito</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {stats?.validationRate || 0}%
                </span>
                {stats?.validationRate && stats.validationRate > 90 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
