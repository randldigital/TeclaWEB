import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Star, Calendar, Clock, Euro } from "lucide-react";
import { Play } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function EventsSection() {
  const { data: plays, isLoading, error } = useQuery<Play[]>({
    queryKey: ["/api/plays"],
    queryFn: async () => {
      const response = await fetch("/api/plays?limit=10");
      if (!response.ok) {
        throw new Error("Error al cargar las obras");
      }
      return response.json();
    },
  });

  const featuredPlay = plays?.[0];
  const otherPlays = plays?.slice(1, 4) || [];

  return (
    <section className="py-16 bg-white" id="events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-claret-blue mb-4">Próximas Obras</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestro programa de obras teatrales y reserva tus entradas
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-12">
            {/* Featured Event Skeleton */}
            <div className="bg-gradient-to-r from-claret-blue to-claret-navy rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-12 w-40" />
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            </div>
            
            {/* Other Events Skeletons */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-claret-red mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar las obras</h4>
            <p className="text-gray-600">No se pudieron cargar las obras. Inténtalo de nuevo más tarde.</p>
          </div>
        ) : plays && plays.length > 0 ? (
          <>
            {/* Featured Event */}
            {featuredPlay && (
              <div className="bg-gradient-to-r from-claret-blue to-claret-navy rounded-2xl p-8 mb-12 text-white">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center bg-claret-yellow text-claret-navy px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <Star className="w-4 h-4 mr-2" />
                      Obra Destacada
                    </div>
                    <h4 className="text-3xl font-bold mb-4">{featuredPlay.title}</h4>
                    <p className="text-blue-100 text-lg mb-6">
                      {featuredPlay.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-claret-yellow" />
                        <span>{format(new Date(featuredPlay.dateTime), "d MMMM yyyy", { locale: es })}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-claret-yellow" />
                        <span>{format(new Date(featuredPlay.dateTime), "HH:mm'h'")}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-5 h-5 text-claret-yellow" />
                        <span>{featuredPlay.basePrice}€</span>
                      </div>
                    </div>
                    <Button 
                      className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                      data-testid="button-reserve-featured-tickets"
                    >
                      Reservar Entradas
                    </Button>
                  </div>
                  <div className="relative">
                    {featuredPlay.posterUrl ? (
                      <img 
                        src={featuredPlay.posterUrl} 
                        alt={`Cartel de ${featuredPlay.title}`}
                        className="rounded-xl shadow-2xl w-full max-w-sm mx-auto"
                      />
                    ) : (
                      <div className="rounded-xl shadow-2xl w-full max-w-sm mx-auto h-64 bg-claret-yellow/20 flex items-center justify-center">
                        <Star className="w-16 h-16 text-claret-yellow" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event Grid */}
            {otherPlays.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPlays.map((play) => (
                  <EventCard key={play.id} play={play} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay obras programadas</h4>
            <p className="text-gray-600">No hay obras programadas en este momento. ¡Mantente atento para próximos anuncios!</p>
          </div>
        )}
      </div>
    </section>
  );
}
