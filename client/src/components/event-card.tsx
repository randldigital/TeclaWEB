import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Euro, Theater } from "lucide-react";
import { Play } from "@shared/schema";
import { formatDate, formatTime } from "@/utils/date-utils";

interface EventCardProps {
  play: Play;
}

export function EventCard({ play }: EventCardProps) {
  const getGenreColor = (genre?: string) => {
    if (!genre) return "bg-claret-blue text-white";
    
    switch (genre.toLowerCase()) {
      case "drama":
        return "bg-claret-blue text-white";
      case "musical":
        return "bg-claret-yellow text-claret-navy";
      case "danza":
        return "bg-claret-red text-white";
      case "comedia":
        return "bg-green-500 text-white";
      default:
        return "bg-claret-blue text-white";
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:transform hover:scale-105"
      data-testid={`event-card-${play.id}`}
    >
      {play.posterUrl ? (
        <img 
          src={play.posterUrl} 
          alt={`Cartel de ${play.title}`}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-claret-blue to-claret-navy flex items-center justify-center">
          <Theater className="w-16 h-16 text-claret-yellow" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={getGenreColor(play.genre || undefined)}>
            {play.genre || "Teatro"}
          </Badge>
          <span className="text-claret-red font-semibold flex items-center">
            <Euro className="w-4 h-4 mr-1" />
            {play.basePrice}€
          </span>
        </div>
        <h5 className="text-xl font-semibold text-claret-blue mb-2 hover:text-claret-navy">
          <Link href={`/events/${play.id}`} data-testid={`link-event-${play.id}`}>
            {play.title}
          </Link>
        </h5>
        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
          {play.description}
        </p>
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(play.dateTime, "d MMM")}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(play.dateTime)}</span>
          </span>
        </div>
        <Button 
          className="w-full bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy py-2 rounded-lg font-medium transition-colors"
          asChild
          data-testid={`button-view-details-${play.id}`}
        >
          <Link href={`/events/${play.id}`}>
            Ver Detalles
          </Link>
        </Button>
      </div>
    </div>
  );
}
