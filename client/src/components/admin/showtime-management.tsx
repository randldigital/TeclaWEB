import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Euro, Plus, Edit, Trash2, Theater } from "lucide-react";
import { Play } from "@shared/schema";
import { formatDate, formatTime } from "@/utils/date-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreateShowtimeForm } from "./create-showtime-form";

interface ShowtimeManagementProps {
  play: Play;
  onClose: () => void;
}

export function ShowtimeManagement({ play, onClose }: ShowtimeManagementProps) {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch showtimes for this play
  const { data: showtimes, isLoading } = useQuery<Play[]>({
    queryKey: ["/api/plays", play.id, "showtimes"],
    queryFn: async () => {
      const response = await fetch(`/api/plays/${play.id}/showtimes`);
      if (!response.ok) {
        throw new Error("Error al cargar los showtimes");
      }
      return response.json();
    },
  });

  // Delete showtime mutation
  const deleteShowtimeMutation = useMutation({
    mutationFn: async (showtimeId: string) => {
      await apiRequest("DELETE", `/api/plays/${showtimeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Showtime eliminado",
        description: "El showtime ha sido eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "showtimes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plays-grouped"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteShowtime = (showtimeId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este showtime?")) {
      deleteShowtimeMutation.mutate(showtimeId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-claret-blue flex items-center">
                <Theater className="w-5 h-5 mr-2" />
                Gestión de Showtimes
              </CardTitle>
              <CardDescription>
                {play.title} - Gestiona las fechas y horarios disponibles
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Play Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{play.title}</h3>
                  <p className="text-sm text-gray-600">{play.description}</p>
                </div>
                <Badge variant="secondary">{play.genre || "Teatro"}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Add Showtime Button */}
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-gray-900">Showtimes Disponibles</h4>
            <Button 
              className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Showtime
            </Button>
          </div>

          {/* Showtimes List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : showtimes && showtimes.length > 0 ? (
            <div className="space-y-4">
              {showtimes.map((showtime) => (
                <Card key={showtime.id} data-testid={`showtime-${showtime.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(showtime.dateTime, "EEEE, d 'de' MMMM 'de' yyyy")}
                          </span>
                          <span className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTime(showtime.dateTime)}
                          </span>
                          <span className="flex items-center text-sm font-semibold text-claret-red">
                            <Euro className="w-4 h-4 mr-1" />
                            {showtime.basePrice}€
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {showtime.id === play.id && (
                            <Badge variant="outline" className="text-xs">
                              Showtime Principal
                            </Badge>
                          )}
                          {new Date(showtime.dateTime) < new Date() && (
                            <Badge variant="secondary" className="text-xs">
                              Pasado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a href={`/events/${showtime.id}`} target="_blank" rel="noopener noreferrer">
                            Ver
                          </a>
                        </Button>
                        {showtime.id !== play.id && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteShowtime(showtime.id)}
                            disabled={deleteShowtimeMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay showtimes</h4>
              <p className="text-gray-600">Agrega el primer showtime para esta obra.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Showtime Form Modal */}
      {showCreateForm && (
        <CreateShowtimeForm
          play={play}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "showtimes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/plays-grouped"] });
          }}
        />
      )}
    </div>
  );
}

