import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Showtime {
  id: string;
  title: string;
  description: string;
  posterUrl: string | null;
  dateTime: Date;
  basePrice: number;
  genre: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ShowtimePickerProps {
  playId: string;
  onShowtimeSelect: (showtime: Showtime) => void;
  selectedShowtimeId?: string;
}

export function ShowtimePicker({ playId, onShowtimeSelect, selectedShowtimeId }: ShowtimePickerProps) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/plays/${playId}/showtimes`);
        if (!response.ok) {
          throw new Error('Failed to fetch showtimes');
        }
        const data = await response.json();
        setShowtimes(data);
        
        // Auto-select the first showtime if only one exists and none is selected
        if (data.length === 1 && !selectedShowtimeId) {
          onShowtimeSelect(data[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading showtimes');
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [playId, selectedShowtimeId, onShowtimeSelect]);

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

  // Group showtimes by date
  const groupedShowtimes = showtimes.reduce((groups, showtime) => {
    const date = new Date(showtime.dateTime);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(showtime);
    return groups;
  }, {} as Record<string, Showtime[]>);

  // If there's only one showtime, show it in a simplified format
  if (showtimes.length === 1) {
    const singleShowtime = showtimes[0];
    const showtimeDate = new Date(singleShowtime.dateTime);
    const isSelected = selectedShowtimeId === singleShowtime.id;
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Showtime Disponible</h3>
          <p className="text-gray-600">Este evento tiene una única función</p>
        </div>

        <Card className={`border-2 ${isSelected ? 'border-claret-blue bg-claret-blue/5' : 'border-gray-200'}`}>
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
            
            {!isSelected && (
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
                    
                    return (
                      <Button
                        key={showtime.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`h-auto p-4 flex flex-col items-center gap-2 ${
                          isSelected 
                            ? "bg-claret-blue text-white border-claret-blue" 
                            : "hover:border-claret-blue hover:text-claret-blue"
                        }`}
                        onClick={() => onShowtimeSelect(showtime)}
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

