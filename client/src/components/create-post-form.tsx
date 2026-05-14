import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Image, X } from "lucide-react";
import { FileUpload } from "@/components/file-upload";

const createPostSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  excerpt: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "HIDDEN"]).default("DRAFT"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

interface CreatePostFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostForm({ isOpen, onClose }: CreatePostFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImage, setUploadedImage] = useState<{ url: string; filename: string } | null>(null);

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      imageUrl: "",
      status: "DRAFT",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      const response = await apiRequest("POST", "/api/posts", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post creado",
        description: "El post ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostForm) => {
    createPostMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setUploadedImage(null);
    onClose();
  };

  const handleImageUpload = (fileData: any) => {
    setUploadedImage({ url: fileData.url, filename: fileData.filename });
    form.setValue("imageUrl", fileData.url);
  };

  const handleImageError = (error: string) => {
    toast({
      title: "Error al subir imagen",
      description: error,
      variant: "destructive",
    });
  };

  const removeImage = () => {
    setUploadedImage(null);
    form.setValue("imageUrl", "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-claret-blue flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Crear Nuevo Post
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo post para el blog del teatro
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Título del post"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-claret-red">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumen</Label>
            <Textarea
              id="excerpt"
              placeholder="Breve descripción del post"
              rows={3}
              {...form.register("excerpt")}
            />
            {form.formState.errors.excerpt && (
              <p className="text-sm text-claret-red">{form.formState.errors.excerpt.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagen destacada</Label>
            {uploadedImage ? (
              <div className="border rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Image className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Imagen cargada</p>
                      <p className="text-xs text-gray-500">{uploadedImage.filename}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-3">
                  <img 
                    src={uploadedImage.url} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              </div>
            ) : (
              <FileUpload
                onUploadSuccess={handleImageUpload}
                onUploadError={handleImageError}
                accept="image"
                maxSize={20 * 1024 * 1024} // 20MB
                className="w-full"
              />
            )}
            {form.formState.errors.imageUrl && (
              <p className="text-sm text-claret-red">{form.formState.errors.imageUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenido *</Label>
            <Textarea
              id="content"
              placeholder="Contenido completo del post"
              rows={8}
              {...form.register("content")}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-claret-red">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="PUBLISHED">Publicado</SelectItem>
                <SelectItem value="HIDDEN">Oculto</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-claret-red">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-claret-blue hover:bg-claret-navy"
              disabled={createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "Creando..." : "Crear Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

