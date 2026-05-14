import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Image as ImageIcon, ArrowUp, ArrowDown, Send, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Play } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, parseDatabaseDate } from "@/utils/date-utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type PlayComment = {
  id: string;
  playId: string;
  userId: string;
  content: string;
  status: "pending" | "approved";
  createdAt: string;
  userName: string;
};

type PlayMemoryPhoto = {
  id: string;
  playId: string;
  imageUrl: string;
  displayOrder: number;
  createdBy: string;
  createdAt: string;
};

interface PastPlayMemoryProps {
  play: Play;
  showtimes: Play[];
}

export function PastPlayMemory({ play, showtimes }: PastPlayMemoryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const firstShowtimeYear = useMemo(() => {
    if (showtimes.length === 0) {
      return parseDatabaseDate(play.dateTime).getFullYear();
    }
    const first = [...showtimes].sort(
      (a, b) => parseDatabaseDate(a.dateTime).getTime() - parseDatabaseDate(b.dateTime).getTime(),
    )[0];
    return parseDatabaseDate(first.dateTime).getFullYear();
  }, [play.dateTime, showtimes]);

  const { data: comments = [] } = useQuery<PlayComment[]>({
    queryKey: ["/api/plays", play.id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/plays/${play.id}/comments`, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Error al cargar comentarios");
      }
      return response.json();
    },
  });

  const { data: photos = [] } = useQuery<PlayMemoryPhoto[]>({
    queryKey: ["/api/plays", play.id, "memory-photos"],
    queryFn: async () => {
      const response = await fetch(`/api/plays/${play.id}/memory-photos`, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Error al cargar fotos");
      }
      return response.json();
    },
  });

  const submitCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/plays/${play.id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      toast({
        title: "Comentario enviado",
        description: "Tu comentario está pendiente de aprobación.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "comments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "No se pudo enviar el comentario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("POST", `/api/plays/${play.id}/comments/${commentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "comments"] });
    },
  });

  const rejectCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("POST", `/api/plays/${play.id}/comments/${commentId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "comments"] });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!uploadResponse.ok) {
        throw new Error("No se pudo subir la imagen");
      }
      const uploadData = await uploadResponse.json();
      await apiRequest("POST", `/api/plays/${play.id}/memory-photos`, {
        imageUrl: uploadData.url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "memory-photos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al subir foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reorderPhotosMutation = useMutation({
    mutationFn: async (photoIds: string[]) => {
      await apiRequest("PATCH", `/api/plays/${play.id}/memory-photos/order`, { photoIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plays", play.id, "memory-photos"] });
    },
  });

  const approvedComments = comments.filter((comment) => comment.status === "approved");
  const pendingComments = comments.filter((comment) => comment.status === "pending");
  const sortedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const canUploadPhoto = user?.role === "ADMIN" && sortedPhotos.length < 3;

  const handleReorder = (photoId: string, direction: "up" | "down") => {
    const currentIndex = sortedPhotos.findIndex((photo) => photo.id === photoId);
    if (currentIndex < 0) return;
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= sortedPhotos.length) return;

    const reordered = [...sortedPhotos];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(swapIndex, 0, moved);
    reorderPhotosMutation.mutate(reordered.map((photo) => photo.id));
  };

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    setZoomLevel(1);
    setIsLightboxOpen(true);
  };

  const currentLightboxPhoto = sortedPhotos[selectedPhotoIndex];

  const goToPreviousPhoto = () => {
    if (!sortedPhotos.length) return;
    setSelectedPhotoIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    setZoomLevel(1);
  };

  const goToNextPhoto = () => {
    if (!sortedPhotos.length) return;
    setSelectedPhotoIndex((prev) => (prev + 1) % sortedPhotos.length);
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-claret-blue mb-2">
            {play.title} ({firstShowtimeYear})
          </h1>
          <p className="text-gray-600 text-lg mb-4">{play.description}</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold text-claret-blue">Género:</span> {play.genre || "Teatro"}</p>
          </div>
        </div>
        <div>
          {play.posterUrl ? (
            <img
              src={play.posterUrl}
              alt={`Cartel de ${play.title}`}
              className="w-full max-w-md rounded-lg border object-cover"
            />
          ) : (
            <div className="w-full max-w-md h-72 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-500">
              Cartel no disponible
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-claret-blue flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Galería de recuerdos
          </CardTitle>
          <CardDescription>Fotos subidas por administración</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.role === "ADMIN" && canUploadPhoto && (
            <div>
              <label className="text-sm font-medium text-gray-700">Añadir foto (máximo 3)</label>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    uploadPhotoMutation.mutate(file);
                  }
                }}
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPhotos.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="grid lg:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => openLightbox(0)}
                    className="lg:col-span-2 group relative overflow-hidden rounded-lg border"
                  >
                    <img
                      src={sortedPhotos[0].imageUrl}
                      alt="Foto principal de recuerdo"
                      className="w-full h-72 lg:h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>

                  <div className="grid grid-rows-2 gap-4">
                    {sortedPhotos.slice(1).map((photo, offset) => {
                      const photoIndex = offset + 1;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => openLightbox(photoIndex)}
                          className="group relative overflow-hidden rounded-lg border"
                        >
                          <img
                            src={photo.imageUrl}
                            alt={`Recuerdo ${photoIndex + 1}`}
                            className="w-full h-36 lg:h-[188px] object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                      );
                    })}
                    {sortedPhotos.length === 1 && (
                      <div className="hidden lg:block rounded-lg border border-dashed border-gray-200" />
                    )}
                  </div>
                </div>

                {user?.role === "ADMIN" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sortedPhotos.map((photo, index) => (
                      <div key={`controls-${photo.id}`} className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <span className="text-xs text-gray-600">Foto {index + 1}</span>
                        <Button variant="outline" size="sm" onClick={() => handleReorder(photo.id, "up")} disabled={index === 0}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(photo.id, "down")}
                          disabled={index === sortedPhotos.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-6xl w-[95vw] p-4 sm:p-6">
          <DialogTitle className="sr-only">Galería de recuerdos</DialogTitle>
          {currentLightboxPhoto && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Foto {selectedPhotoIndex + 1} de {sortedPhotos.length}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setZoomLevel(1)}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="relative overflow-auto rounded-lg border bg-black/5 h-[70vh] flex items-center justify-center">
                <img
                  src={currentLightboxPhoto.imageUrl}
                  alt={`Recuerdo ${selectedPhotoIndex + 1}`}
                  className="max-h-[68vh] object-contain transition-transform duration-150"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>

              {sortedPhotos.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={goToPreviousPhoto}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <Button variant="outline" onClick={goToNextPhoto}>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-claret-blue flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comentarios
          </CardTitle>
          <CardDescription>Recuerdos y opiniones de quienes asistieron</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="space-y-2">
              <Textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Comparte tu recuerdo de esta obra..."
              />
              <Button
                className="bg-claret-blue hover:bg-claret-navy text-white"
                onClick={() => submitCommentMutation.mutate(commentText)}
                disabled={!commentText.trim() || submitCommentMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar comentario
              </Button>
            </div>
          )}

          {approvedComments.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-sm">{comment.userName}</p>
                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
              </div>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          ))}

          {user?.role === "ADMIN" && pendingComments.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-claret-blue mb-3">Pendientes de moderación</h4>
              <div className="space-y-3">
                {pendingComments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border p-3 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-sm">{comment.userName}</p>
                      <Badge variant="secondary">Pendiente</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveCommentMutation.mutate(comment.id)}>
                        Aprobar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectCommentMutation.mutate(comment.id)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
