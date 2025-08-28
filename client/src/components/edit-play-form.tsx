import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Theater } from "lucide-react";
import { Play } from "@shared/schema";

const editPlaySchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  dateTime: z.string().min(1, "La fecha y hora son requeridas"),
  basePrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  genre: z.string().optional(),
});

type EditPlayForm = z.infer<typeof editPlaySchema>;

interface EditPlayFormProps {
  isOpen: boolean;
  onClose: () => void;
  play: Play | null;
}

export function EditPlayForm({ isOpen, onClose, play }: EditPlayFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditPlayForm>({
    resolver: zodResolver(editPlaySchema),
    defaultValues: {
      title: "",
      description: "",
      dateTime: "",
      basePrice: 15,
      genre: "",
    },
  });

  // Update form when play data changes
  useEffect(() => {
    if (play) {
      const dateTime = new Date(play.dateTime);
      const localDateTime = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      form.reset({
        title: play.title,
        description: play.description,
        dateTime: localDateTime,
        basePrice: play.basePrice || 15,
        genre: play.genre || "",
      });
    }
  }, [play, form]);

  const editPlayMutation = useMutation({
    mutationFn: async (data: EditPlayForm) => {
      if (!play) throw new Error("No play selected");
      const response = await apiRequest("PUT", `/api/plays/${play.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Obra actualizada",
        description: "La obra ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plays"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar obra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditPlayForm) => {
    // Convert the date string to ISO format
    const dateTime = new Date(data.dateTime).toISOString();
    editPlayMutation.mutate({
      ...data,
      dateTime,
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!play) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-claret-blue flex items-center gap-2">
            <Theater className="w-6 h-6" />
            Editar Obra
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles de la obra de teatro
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              placeholder="Título de la obra"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-claret-red">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción *</Label>
            <Textarea
              id="edit-description"
              placeholder="Descripción de la obra"
              rows={4}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-claret-red">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dateTime">Fecha y Hora *</Label>
              <Input
                id="edit-dateTime"
                type="datetime-local"
                {...form.register("dateTime")}
              />
              {form.formState.errors.dateTime && (
                <p className="text-sm text-claret-red">{form.formState.errors.dateTime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-basePrice">Precio Base (€) *</Label>
              <Input
                id="edit-basePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="15.00"
                {...form.register("basePrice", { valueAsNumber: true })}
              />
              {form.formState.errors.basePrice && (
                <p className="text-sm text-claret-red">{form.formState.errors.basePrice.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-genre">Género</Label>
            <Input
              id="edit-genre"
              placeholder="Ej: Drama, Comedia, Musical"
              {...form.register("genre")}
            />
            {form.formState.errors.genre && (
              <p className="text-sm text-claret-red">{form.formState.errors.genre.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy"
              disabled={editPlayMutation.isPending}
            >
              {editPlayMutation.isPending ? "Actualizando..." : "Actualizar Obra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

