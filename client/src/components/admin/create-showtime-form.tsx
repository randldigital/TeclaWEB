import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Euro, X } from "lucide-react";
import { Play } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface CreateShowtimeFormProps {
  play: Play;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateShowtimeForm({ play, onClose, onSuccess }: CreateShowtimeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    basePrice: play.basePrice.toString(),
  });

  const createShowtimeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");
      
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const response = await apiRequest("POST", `/api/plays/${play.id}/showtimes`, {
        title: play.title,
        description: play.description,
        posterUrl: play.posterUrl,
        dateTime: dateTime.toISOString(),
        basePrice: parseFloat(formData.basePrice),
        genre: play.genre,
        createdBy: user.id,
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Showtime creado",
        description: "El nuevo showtime ha sido creado correctamente.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear showtime",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    createShowtimeMutation.mutate();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-claret-blue">Nuevo Showtime</CardTitle>
              <CardDescription>
                Agregar nueva fecha y hora para {play.title}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Fecha
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Time Input */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Hora
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                required
              />
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center">
                <Euro className="w-4 h-4 mr-2" />
                Precio (€)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => handleInputChange("basePrice", e.target.value)}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy"
                disabled={createShowtimeMutation.isPending}
              >
                {createShowtimeMutation.isPending ? "Creando..." : "Crear Showtime"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
