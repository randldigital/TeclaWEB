import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Ticket, 
  CheckCircle, 
  Clock, 
  Euro, 
  TrendingUp, 
  Calendar,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PlayStatisticsModalProps {
  playId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PlayStatistics {
  playId: string;
  playTitle: string;
  basePrice: number;
  totalTicketRecords: number;
  totalPeople: number;
  paidTicketRecords: number;
  paidPeople: number;
  pendingTicketRecords: number;
  pendingPeople: number;
  paymentRate: number;
  moneyExpected: number;
  moneyGathered: number;
  outstandingAmount: number;
  averageRevenuePerPerson: number;
  lastTicketDate: string | null;
  firstTicketDate: string | null;
}

export function PlayStatisticsModal({ playId, isOpen, onClose }: PlayStatisticsModalProps) {
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ["play-statistics", playId],
    queryFn: async () => {
      const response = await fetch(`/api/plays/${playId}/statistics`);
      if (!response.ok) {
        throw new Error("Error fetching statistics");
      }
      return response.json() as unknown as PlayStatistics;
    },
    enabled: isOpen,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Error al cargar estadísticas
            </DialogTitle>
            <DialogDescription>
              No se pudieron cargar las estadísticas de la obra.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Estadísticas de la Obra
          </DialogTitle>
          <DialogDescription>
            Información detallada sobre ventas y pagos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ) : statistics ? (
          <div className="space-y-6">
            {/* Play Title */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-claret-blue">{statistics.playTitle}</h2>
              <p className="text-gray-600">Precio base: {formatCurrency(statistics.basePrice)}</p>
            </div>

            {/* Basic Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Ticket className="w-4 h-4 mr-1" />
                    Total Personas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-claret-blue">{statistics.totalPeople}</div>
                  <p className="text-xs text-gray-500 mt-1">({statistics.totalTicketRecords} reservas)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Pagadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{statistics.paidPeople}</div>
                  <p className="text-xs text-gray-500 mt-1">({statistics.paidTicketRecords} reservas)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{statistics.pendingPeople}</div>
                  <p className="text-xs text-gray-500 mt-1">({statistics.pendingTicketRecords} reservas)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Tasa de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{statistics.paymentRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                    <Euro className="w-4 h-4 mr-1" />
                    Dinero Esperado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(statistics.moneyExpected)}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Potencial total</p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Dinero Recaudado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(statistics.moneyGathered)}
                  </div>
                  <p className="text-xs text-green-600 mt-1">Ingresos reales</p>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Pendiente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(statistics.outstandingAmount)}
                  </div>
                  <p className="text-xs text-red-600 mt-1">Por cobrar</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Detallada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Promedio por persona</p>
                    <p className="font-semibold text-lg">{formatCurrency(statistics.averageRevenuePerPerson)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Primera entrada</p>
                    <p className="font-semibold">{formatDate(statistics.firstTicketDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Última entrada</p>
                    <p className="font-semibold">{formatDate(statistics.lastTicketDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Estado</p>
                    <Badge 
                      variant={statistics.paymentRate >= 80 ? "default" : statistics.paymentRate >= 50 ? "secondary" : "destructive"}
                      className="mt-1"
                    >
                      {statistics.paymentRate >= 80 ? "Excelente" : statistics.paymentRate >= 50 ? "Regular" : "Necesita atención"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron estadísticas para esta obra.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
