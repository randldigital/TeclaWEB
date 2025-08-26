import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, Euro, MapPin, Users, Theater, AlertCircle, Ticket } from "lucide-react";
import { Play } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReserving, setIsReserving] = useState(false);
  
  const { data: play, isLoading, error } = useQuery<Play>({
    queryKey: ["/api/plays", id],
    queryFn: async () => {
      const response = await fetch(`/api/plays/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Obra no encontrada");
        }
        throw new Error("Error al cargar la obra");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const reserveTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user || !play) throw new Error("Usuario no autenticado o obra no encontrada");
      
      const response = await apiRequest("POST", "/api/tickets", {
        playId: play.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Entrada reservada!",
        description: "Tu entrada ha sido reservada exitosamente. Recibirás un email de confirmación.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al reservar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReserveTicket = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para reservar entradas.",
        variant: "destructive",
      });
      return;
    }
    
    setIsReserving(true);
    reserveTicketMutation.mutate();
    setTimeout(() => setIsReserving(false), 2000);
  };

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

  const isEventPassed = play ? new Date(play.dateTime) < new Date() : false;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild
            className="text-claret-blue hover:text-claret-navy"
            data-testid="button-back-to-home"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-40" />
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-claret-red mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar la obra</h1>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <Button asChild className="bg-claret-blue hover:bg-claret-navy">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        ) : play ? (
          <div className="grid lg:grid-cols-2 gap-8" data-testid={`event-detail-${play.id}`}>
            {/* Event Information */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className={getGenreColor(play.genre)}>
                    {play.genre || "Teatro"}
                  </Badge>
                  {isEventPassed && (
                    <Badge variant="secondary">Finalizada</Badge>
                  )}
                </div>
                
                <h1 className="text-4xl font-bold text-claret-blue mb-4">
                  {play.title}
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {play.description}
                </p>
              </div>
              
              {/* Event Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-claret-blue flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Detalles del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-claret-yellow" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-gray-600">
                        {format(new Date(play.dateTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-claret-yellow" />
                    <div>
                      <p className="font-medium">Hora</p>
                      <p className="text-gray-600">
                        {format(new Date(play.dateTime), "HH:mm'h'")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-claret-yellow" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-gray-600">Teatro Colegio Claret Sevilla</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Euro className="w-5 h-5 text-claret-yellow" />
                    <div>
                      <p className="font-medium">Precio</p>
                      <p className="text-2xl font-bold text-claret-red">{play.basePrice}€</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Reservation Button */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-claret-blue flex items-center">
                    <Ticket className="w-5 h-5 mr-2" />
                    Reservar Entrada
                  </CardTitle>
                  <CardDescription>
                    {isEventPassed 
                      ? "Este evento ya ha finalizado"
                      : user 
                        ? "Haz clic para reservar tu entrada"
                        : "Inicia sesión para reservar tu entrada"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleReserveTicket}
                    disabled={isEventPassed || isReserving || reserveTicketMutation.isPending}
                    className="w-full bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy font-semibold py-3 transition-all transform hover:scale-105 disabled:transform-none"
                    data-testid="button-reserve-ticket"
                  >
                    {isEventPassed 
                      ? "Evento Finalizado"
                      : isReserving || reserveTicketMutation.isPending
                        ? "Reservando..."
                        : user
                          ? `Reservar Entrada - ${play.basePrice}€`
                          : "Inicia Sesión para Reservar"
                    }
                  </Button>
                  
                  {!user && !isEventPassed && (
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      <Link href="/auth" className="text-claret-blue hover:text-claret-navy underline">
                        Crear cuenta
                      </Link> o iniciar sesión para reservar entradas
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Event Poster */}
            <div className="relative">
              {play.posterUrl ? (
                <img 
                  src={play.posterUrl} 
                  alt={`Cartel de ${play.title}`}
                  className="w-full h-auto rounded-xl shadow-2xl"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-claret-blue to-claret-navy rounded-xl shadow-2xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <Theater className="w-24 h-24 text-claret-yellow mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{play.title}</h3>
                    <p className="text-blue-200">{play.genre || "Teatro"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
      
      <Footer />
    </div>
  );
}
