import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Star, Calendar, Clock, Euro, Theater } from "lucide-react";
import { Play } from "@shared/schema";
import { formatDate, formatTime, parseDatabaseDate } from "@/utils/date-utils";
import { Link } from "wouter";

interface GroupedPlay {
  parentPlay: Play;
  showtimes: Play[];
}

export function EventsSection() {
  const { data: groupedPlays, isLoading, error } = useQuery<GroupedPlay[]>({
    queryKey: ["/api/plays-grouped"],
    queryFn: async () => {
      const response = await fetch("/api/plays-grouped");
      if (!response.ok) {
        throw new Error("Error al cargar las obras");
      }
      return response.json();
    },
  });

  const now = new Date();

  const { activeGroups, historicalGroups, featuredActive } = useMemo(() => {
    const base = groupedPlays ?? [];

    const active = base
      .filter((group) => group.showtimes.some((showtime) => parseDatabaseDate(showtime.dateTime) >= now))
      .map((group) => {
        const nextShowtime = group.showtimes
          .filter((showtime) => parseDatabaseDate(showtime.dateTime) >= now)
          .sort((a, b) => parseDatabaseDate(a.dateTime).getTime() - parseDatabaseDate(b.dateTime).getTime())[0];

        return { ...group, nextShowtime };
      })
      .sort((a, b) => parseDatabaseDate(a.nextShowtime.dateTime).getTime() - parseDatabaseDate(b.nextShowtime.dateTime).getTime());

    const historical = base
      .filter((group) => group.showtimes.some((showtime) => parseDatabaseDate(showtime.dateTime) < now))
      .map((group) => {
        const pastShowtimes = group.showtimes
          .filter((showtime) => parseDatabaseDate(showtime.dateTime) < now)
          .sort((a, b) => parseDatabaseDate(a.dateTime).getTime() - parseDatabaseDate(b.dateTime).getTime());
        const firstPastShowtime = pastShowtimes[0];
        const firstYear = parseDatabaseDate(firstPastShowtime.dateTime).getFullYear();
        const lastYear = parseDatabaseDate(pastShowtimes[pastShowtimes.length - 1].dateTime).getFullYear();
        const periodLabel = firstYear === lastYear ? `${firstYear}` : `${firstYear} - ${lastYear}`;

        return { ...group, firstYear, periodLabel };
      })
      .sort((a, b) => b.firstYear - a.firstYear);

    return {
      activeGroups: active,
      historicalGroups: historical,
      featuredActive: active[0],
    };
  }, [groupedPlays]);

  return (
    <section className="py-16 bg-white" id="events">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-claret-blue mb-4">Próximas Obras</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Visita nuestro calendario y reserva tus entradas.
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
        ) : groupedPlays && groupedPlays.length > 0 ? (
          <>
            {activeGroups.length === 0 ? (
              <div className="mb-12 rounded-xl border border-blue-100 bg-blue-50 p-6 text-center">
                <p className="text-lg font-medium text-claret-blue">
                  Nuevas obras próximamente, ¡echa un vistazo a nuestros espectáculos pasados!
                </p>
              </div>
            ) : null}

            {/* Featured active play */}
            {featuredActive && (
              <div className="bg-gradient-to-r from-claret-blue to-claret-navy rounded-2xl p-8 mb-12 text-white">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-flex items-center bg-claret-yellow text-claret-navy px-4 py-2 rounded-full text-sm font-semibold mb-4">
                      <Star className="w-4 h-4 mr-2" />
                      Obra Destacada
                    </div>
                    <h4 className="text-3xl font-bold mb-4">{featuredActive.parentPlay.title}</h4>
                    <p className="text-blue-100 text-lg mb-6">
                      {featuredActive.parentPlay.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-claret-yellow" />
                        <span>
                          {formatDate(featuredActive.nextShowtime.dateTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-claret-yellow" />
                        <span>
                          {formatTime(featuredActive.nextShowtime.dateTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-5 h-5 text-claret-yellow" />
                        <span>Desde {Math.min(...featuredActive.showtimes.map((s) => s.basePrice))}€</span>
                      </div>
                    </div>
                    <Button 
                      className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                      asChild
                      data-testid="button-reserve-featured-tickets"
                    >
                      <Link href={`/events/${featuredActive.parentPlay.id}`}>
                        Reservar Entradas
                      </Link>
                    </Button>
                  </div>
                  <div className="relative">
                    {featuredActive.parentPlay.posterUrl ? (
                      <img 
                        src={featuredActive.parentPlay.posterUrl} 
                        alt={`Cartel de ${featuredActive.parentPlay.title}`}
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

            {/* Active plays */}
            {activeGroups.length > 1 && (
              <>
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-claret-blue">Obras Activas</h4>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {activeGroups.slice(1).map((group) => (
                    <div key={group.parentPlay.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                      {group.parentPlay.posterUrl ? (
                        <img src={group.parentPlay.posterUrl} alt={`Cartel de ${group.parentPlay.title}`} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-claret-blue to-claret-navy flex items-center justify-center">
                          <Theater className="w-14 h-14 text-claret-yellow" />
                        </div>
                      )}
                      <div className="p-6">
                        <h5 className="text-xl font-semibold text-claret-blue mb-2">{group.parentPlay.title}</h5>
                        <p className="text-gray-600 mb-4 text-sm line-clamp-2">{group.parentPlay.description}</p>
                        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 mb-4">
                          <p className="text-sm font-medium text-claret-blue">Próxima función</p>
                          <p className="text-sm text-gray-700">{formatDate(group.nextShowtime.dateTime)} · {formatTime(group.nextShowtime.dateTime)}</p>
                        </div>
                        <Button className="w-full bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy" asChild>
                          <Link href={`/events/${group.parentPlay.id}`}>Ver funciones</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Historical plays */}
            {historicalGroups.length > 0 && (
              <>
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-claret-blue">Histórico</h4>
                </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {historicalGroups.map((group) => (
                  <div key={`${group.parentPlay.id}-${group.firstYear}`} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="p-6">
                      <h5 className="text-xl font-semibold text-claret-blue mb-2">
                        {group.parentPlay.title} ({group.firstYear})
                      </h5>
                      <p className="text-gray-600 mb-3 text-sm line-clamp-2">{group.parentPlay.description}</p>
                      <p className="text-sm text-gray-500 mb-4">Periodo: {group.periodLabel}</p>
                      <Button className="w-full bg-claret-blue hover:bg-claret-navy text-white" asChild>
                        <Link href={`/events/${group.parentPlay.id}?mode=memory`}>Ver memoria</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              </>
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
