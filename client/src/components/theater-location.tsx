import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, ExternalLink, Clock, Car, Bus, Train } from "lucide-react";

interface TheaterLocationProps {
  address: string;
  mapsUrl: string;
  embedUrl?: string;
  showMap?: boolean;
}

export function TheaterLocation({ 
  address, 
  mapsUrl, 
  embedUrl,
  showMap = true 
}: TheaterLocationProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const handleMapError = () => {
    setMapError(true);
    setMapLoaded(false);
  };

  const openInMaps = () => {
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const getDirections = () => {
    // Open Google Maps with directions from current location
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="border-claret-blue/20 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader>
        <CardTitle className="text-claret-blue flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Ubicación del Teatro
        </CardTitle>
        <CardDescription>
          Teatro Colegio Claret Sevilla - Ven a disfrutar de nuestras obras
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Address and Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-claret-blue/20">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-claret-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Teatro Colegio Claret Sevilla</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {address}
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="outline" className="text-xs bg-claret-yellow/10 border-claret-yellow/20 text-claret-navy">
                    <Clock className="w-3 h-3 mr-1" />
                    Abierto para eventos
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={openInMaps}
              variant="outline"
              className="border-claret-blue/30 text-claret-blue hover:bg-claret-blue hover:text-white transition-all"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver en Google Maps
            </Button>
            <Button
              onClick={getDirections}
              className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Cómo llegar
            </Button>
          </div>
        </div>

        {/* Map Embed */}
        {showMap && embedUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Ubicación en el mapa</h4>
              {!mapLoaded && !mapError && (
                <div className="text-sm text-gray-500">Cargando mapa...</div>
              )}
            </div>
            
            <div className="relative">
              {!mapLoaded && !mapError && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-gray-500">Cargando mapa...</p>
                  </div>
                </div>
              )}
              
              {mapError ? (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">No se pudo cargar el mapa</p>
                  <Button
                    onClick={openInMaps}
                    variant="outline"
                    size="sm"
                    className="border-claret-blue/30 text-claret-blue hover:bg-claret-blue hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver en Google Maps
                  </Button>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg shadow-md"
                  onLoad={handleMapLoad}
                  onError={handleMapError}
                />
              )}
            </div>
          </div>
        )}

        {/* Transportation Info */}
        <div className="bg-white p-4 rounded-lg border border-claret-blue/20">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-claret-blue" />
            Cómo llegar
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-claret-yellow" />
              <span className="text-gray-600">En coche</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bus className="w-4 h-4 text-claret-yellow" />
              <span className="text-gray-600">En autobús</span>
            </div>
            <div className="flex items-center space-x-2">
              <Train className="w-4 h-4 text-claret-yellow" />
              <span className="text-gray-600">En metro</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Usa el botón "Cómo llegar" arriba para obtener direcciones específicas desde tu ubicación.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
