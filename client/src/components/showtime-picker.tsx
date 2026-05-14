import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Play } from "@shared/schema";

interface ShowtimePickerProps {
  playId: string;
  onShowtimeSelect: (showtime: Play) => void;
  selectedShowtimeId?: string;
  prefetchedShowtimes?: Play[];
  isLoadingPrefetchedShowtimes?: boolean;
}

export function ShowtimePicker({
  playId,
  onShowtimeSelect,
  selectedShowtimeId,
  prefetchedShowtimes,
  isLoadingPrefetchedShowtimes = false,
}: ShowtimePickerProps) {
  const [showtimes, setShowtimes] = useState<Play[]>(prefetchedShowtimes ?? []);
  const [loading, setLoading] = useState(prefetchedShowtimes ? isLoadingPrefetchedShowtimes : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefetchedShowtimes) {
      setShowtimes(prefetchedShowtimes);
      setLoading(isLoadingPrefetchedShowtimes);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchShowtimes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/plays/${playId}/showtimes`);
        if (!response.ok) {
          throw new Error('Failed to fetch showtimes');
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        setShowtimes(data);
        
        // Auto-select the first showtime if only one exists and none is selected
        if (data.length === 1 && !selectedShowtimeId) {
          onShowtimeSelect(data[0]);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Error loading showtimes');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchShowtimes();

    return () => {
      cancelled = true;
    };
  }, [playId, prefetchedShowtimes, isLoadingPrefetchedShowtimes, selectedShowtimeId, onShowtimeSelect]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claret-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (showtimes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No showtimes available for this play.</p>
      </div>
    );
  }

  // Helper function to check if booking is closed for a showtime (1 hour before)
  const isBookingClosed = (showtime: Play): boolean => {
    const showtimeDate = new Date(showtime.dateTime);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
    
    return showtimeDate <= oneHourFromNow;
  };

  // Group showtimes by date
  const groupedShowtimes = showtimes.reduce((groups, showtime) => {
    const date = new Date(showtime.dateTime);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(showtime);
    return groups;
  }, {} as Record<string, Play[]>);

  // If there's only one showtime, show it in a simplified format
  if (showtimes.length === 1) {
    const singleShowtime = showtimes[0];
    const showtimeDate = new Date(singleShowtime.dateTime);
    const isSelected = selectedShowtimeId === singleShowtime.id;
    const bookingClosed = isBookingClosed(singleShowtime);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Showtime Disponible</h3>
          <p className="text-gray-600">Este evento tiene una única función</p>
        </div>

        <Card className={`border-2 ${isSelected ? 'border-claret-blue bg-claret-blue/5' : bookingClosed ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-claret-blue" />
                  <span className="font-medium text-gray-900">
                    {format(showtimeDate, 'EEEE, d MMMM', { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-claret-blue" />
                  <span className="font-medium text-gray-900">
                    {format(showtimeDate, 'HH:mm')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-claret-red">
                  €{singleShowtime.basePrice}
                </div>
                <div className="text-sm text-gray-500">Precio por entrada</div>
              </div>
            </div>
            
            {bookingClosed && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="font-medium text-sm">Reservas cerradas (1 hora antes del inicio)</span>
                </div>
              </div>
            )}
            
            {!isSelected && !bookingClosed && (
              <Button
                className="w-full mt-4 bg-claret-blue hover:bg-claret-navy text-white"
                onClick={() => onShowtimeSelect(singleShowtime)}
              >
                Seleccionar este showtime
              </Button>
            )}
            
            {isSelected && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Showtime seleccionado</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiple showtimes - show grouped format
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Date & Time</h3>
        <p className="text-gray-600">Choose your preferred showtime</p>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedShowtimes).map(([dateKey, dayShowtimes]) => {
          const date = new Date(dateKey);
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
          const isTomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd') === dateKey;

          return (
            <Card key={dateKey} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-claret-blue" />
                  <span className="font-medium text-gray-900">
                    {format(date, 'EEEE, d MMMM', { locale: es })}
                    {isToday && <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Hoy</span>}
                    {isTomorrow && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Mañana</span>}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dayShowtimes.map((showtime) => {
                    const showtimeDate = new Date(showtime.dateTime);
                    const isSelected = selectedShowtimeId === showtime.id;
                    const bookingClosed = isBookingClosed(showtime);
                    
                    return (
                      <Button
                        key={showtime.id}
                        variant={isSelected ? "default" : "outline"}
                        disabled={bookingClosed}
                        className={`h-auto p-4 flex flex-col items-center gap-2 ${
                          isSelected 
                            ? "bg-claret-blue text-white border-claret-blue" 
                            : bookingClosed
                              ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300"
                            : "hover:border-claret-blue hover:text-claret-blue"
                        }`}
                        onClick={() => !bookingClosed && onShowtimeSelect(showtime)}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {format(showtimeDate, 'HH:mm')}
                          </span>
                        </div>
                        <div className="text-sm opacity-90">
                          €{showtime.basePrice}
                        </div>
                        {bookingClosed && (
                          <div className="text-xs text-amber-600 font-medium mt-1">
                            Cerrado
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

