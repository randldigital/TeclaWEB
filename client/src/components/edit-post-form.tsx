import { useState, useEffect } from "react";
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
import { Post } from "@shared/schema";
import { FileUpload } from "@/components/file-upload";

const editPostSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  excerpt: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
});

type EditPostForm = z.infer<typeof editPostSchema>;

interface EditPostFormProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

export function EditPostForm({ isOpen, onClose, post }: EditPostFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImage, setUploadedImage] = useState<{ url: string; filename: string } | null>(null);

  const form = useForm<EditPostForm>({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      imageUrl: "",
      status: "DRAFT",
    },
  });

  // Update form when post data changes
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        imageUrl: post.imageUrl || "",
        status: post.status,
      });
      
      // Set uploaded image if post has an image
      if (post.imageUrl) {
        const filename = post.imageUrl.split('/').pop() || 'image';
        setUploadedImage({ url: post.imageUrl, filename });
      } else {
        setUploadedImage(null);
      }
    }
  }, [post, form]);

  const editPostMutation = useMutation({
    mutationFn: async (data: EditPostForm) => {
      if (!post) throw new Error("No post selected");
      const response = await apiRequest("PUT", `/api/posts/${post.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post actualizado",
        description: "El post ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditPostForm) => {
    editPostMutation.mutate(data);
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

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-claret-blue flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Editar Post
          </DialogTitle>
          <DialogDescription>
            Modifica el contenido del post
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-post-title">Título *</Label>
            <Input
              id="edit-post-title"
              placeholder="Título del post"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-claret-red">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-post-excerpt">Resumen</Label>
            <Textarea
              id="edit-post-excerpt"
              placeholder="Breve resumen del post"
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
            <Label htmlFor="edit-post-content">Contenido *</Label>
            <Textarea
              id="edit-post-content"
              placeholder="Contenido completo del post"
              rows={8}
              {...form.register("content")}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-claret-red">{form.formState.errors.content.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-post-status">Estado *</Label>
            <Select 
              value={form.watch("status")} 
              onValueChange={(value) => form.setValue("status", value as "DRAFT" | "PUBLISHED" | "HIDDEN")}
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
              disabled={editPostMutation.isPending}
            >
              {editPostMutation.isPending ? "Actualizando..." : "Actualizar Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
