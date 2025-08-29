import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Theater, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Mail,
  BarChart3
} from "lucide-react";
import { Post, Play, User, ContactMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, parseDatabaseDate } from "@/utils/date-utils";
import { Link, Redirect } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreatePostForm } from "@/components/create-post-form";
import { CreatePlayForm } from "@/components/create-play-form";
import { EditPlayForm } from "@/components/edit-play-form";
import { EditPostForm } from "@/components/edit-post-form";
import { ValidationManagement } from "@/components/admin/validation-management";
import { ValidationLogs } from "@/components/admin/validation-logs";
import { ValidationStats } from "@/components/admin/validation-stats";
import { ShowtimeManagement } from "@/components/admin/showtime-management";
import { PlayStatisticsModal } from "@/components/play-statistics-modal";
import { UserManagement } from "@/components/admin/user-management";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [showCreatePlayForm, setShowCreatePlayForm] = useState(false);
  const [showEditPlayForm, setShowEditPlayForm] = useState(false);
  const [showEditPostForm, setShowEditPostForm] = useState(false);
  const [showShowtimeManagement, setShowShowtimeManagement] = useState(false);
  const [selectedPlay, setSelectedPlay] = useState<Play | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
  const [showStatisticsModal, setShowStatisticsModal] = useState<string | null>(null);

  // Redirect if not authorized
  if (!user || (user.role !== "ADMIN" && user.role !== "MONITOR")) {
    return <Redirect to="/" />;
  }

  const isAdmin = user.role === "ADMIN";

  // Queries
  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const response = await fetch("/api/posts", {
        credentials: "include"
      });
      return response.json();
    },
  });

  const { data: plays, isLoading: playsLoading } = useQuery<Play[]>({
    queryKey: ["/api/plays"],
    queryFn: async () => {
      const response = await fetch("/api/plays", {
        credentials: "include"
      });
      return response.json();
    },
  });

  const { data: contactMessages, isLoading: messagesLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact"],
    queryFn: async () => {
      const response = await fetch("/api/contact", {
        credentials: "include"
      });
      return response.json();
    },
    enabled: isAdmin,
  });

  // Mutations
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/posts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Post eliminado",
        description: "El post ha sido eliminado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlayMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/plays/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Obra eliminada",
        description: "La obra ha sido eliminada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plays"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMessageStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PUT", `/api/contact/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: "El estado del mensaje ha sido actualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-claret-yellow text-claret-navy";
      case "DRAFT":
        return "bg-gray-200 text-gray-700";
      case "HIDDEN":
        return "bg-claret-red text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Publicado";
      case "DRAFT":
        return "Borrador";
      case "HIDDEN":
        return "Oculto";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-claret-blue mb-2">Panel de Administración</h1>
          <p className="text-gray-600">
            Gestiona el contenido y configuración del teatro escolar
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2" data-testid="tab-overview">
              <Settings className="w-4 h-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center space-x-2" data-testid="tab-posts">
              <FileText className="w-4 h-4" />
              <span>Posts</span>
            </TabsTrigger>
            <TabsTrigger value="plays" className="flex items-center space-x-2" data-testid="tab-plays">
              <Theater className="w-4 h-4" />
              <span>Obras</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center space-x-2" data-testid="tab-users">
                <Users className="w-4 h-4" />
                <span>Usuarios</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="validation" className="flex items-center space-x-2" data-testid="tab-validation">
                <Settings className="w-4 h-4" />
                <span>Validación</span>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="messages" className="flex items-center space-x-2" data-testid="tab-messages">
                <Mail className="w-4 h-4" />
                <span>Mensajes</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{posts?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {posts?.filter(p => p.status === "PUBLISHED").length || 0} publicados
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Obras</CardTitle>
                  <Theater className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{plays?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {plays?.filter(p => {
                      try {
                        return p.dateTime && parseDatabaseDate(p.dateTime) > new Date();
                      } catch (error) {
                        console.warn('Invalid date for play:', p.id, p.dateTime);
                        return false;
                      }
                    }).length || 0} próximas
                  </p>
                </CardContent>
              </Card>
              
              {isAdmin && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contactMessages?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {contactMessages?.filter(m => m.status === "UNREAD").length || 0} sin leer
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tu Rol</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.role}</div>
                  <p className="text-xs text-muted-foreground">
                    {user.name}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Acciones comunes para gestionar el contenido
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button 
                  className="bg-claret-blue hover:bg-claret-navy" 
                  data-testid="button-new-post"
                  onClick={() => setShowCreatePostForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Post
                </Button>
                <Button 
                  className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy" 
                  data-testid="button-new-play"
                  onClick={() => setShowCreatePlayForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Obra
                </Button>
                {isAdmin && (
                  <>
                    <Button 
                      variant="outline" 
                      data-testid="button-validation-camera"
                      onClick={() => window.open('/validacion', '_blank')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Validación Cámara
                    </Button>
                    <Button 
                      variant="outline" 
                      data-testid="button-validation-manual"
                      onClick={() => window.open('/qr-validator', '_blank')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Validación Manual
                    </Button>
                    <Button 
                      variant="outline" 
                      data-testid="button-settings"
                      onClick={() => {
                        toast({
                          title: "Configuración",
                          description: "La funcionalidad de configuración estará disponible próximamente.",
                        });
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-claret-blue">Gestión de Posts</h2>
              <Button 
                className="bg-claret-blue hover:bg-claret-navy" 
                data-testid="button-create-post"
                onClick={() => setShowCreatePostForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Post
              </Button>
            </div>

            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} data-testid={`admin-post-${post.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getStatusColor(post.status)}>
                              {getStatusText(post.status)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(post.createdAt, "d MMM yyyy")}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" asChild data-testid={`button-view-post-${post.id}`}>
                            <Link href={`/posts/${post.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-edit-post-${post.id}`}
                            onClick={() => {
                              setSelectedPost(post);
                              setShowEditPostForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deletePostMutation.mutate(post.id)}
                            disabled={deletePostMutation.isPending}
                            data-testid={`button-delete-post-${post.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay posts</h3>
                <p className="text-gray-600">Crea tu primer post para comenzar.</p>
              </div>
            )}
          </TabsContent>

          {/* Plays Tab */}
          <TabsContent value="plays" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-claret-blue">Gestión de Obras</h2>
              <Button 
                className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy" 
                data-testid="button-create-play"
                onClick={() => setShowCreatePlayForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Obra
              </Button>
            </div>

            {playsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : plays && plays.length > 0 ? (
              <div className="space-y-4">
                {plays.map((play) => (
                  <Card key={play.id} data-testid={`admin-play-${play.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {play.genre && (
                              <Badge variant="secondary">{play.genre}</Badge>
                            )}
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(play.dateTime, "d MMM yyyy - HH:mm'h'")}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Showtime Principal
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {play.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {play.description}
                          </p>
                          <p className="text-claret-red font-semibold text-sm mt-1">
                            Precio: {play.basePrice}€
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" asChild data-testid={`button-view-play-${play.id}`}>
                            <Link href={`/events/${play.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-edit-play-${play.id}`}
                            onClick={() => {
                              setSelectedPlay(play);
                              setShowEditPlayForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-claret-blue hover:bg-claret-navy text-white"
                            data-testid={`button-manage-showtimes-${play.id}`}
                            onClick={() => {
                              setSelectedPlay(play);
                              setShowShowtimeManagement(true);
                            }}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            data-testid={`button-statistics-${play.id}`}
                            onClick={() => setShowStatisticsModal(play.id)}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setShowDeleteConfirmation(play.id)}
                            disabled={deletePlayMutation.isPending}
                            data-testid={`button-delete-play-${play.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Theater className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay obras</h3>
                <p className="text-gray-600">Crea tu primera obra para comenzar.</p>
              </div>
            )}
          </TabsContent>

          {/* Messages Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="messages" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-claret-blue">Mensajes de Contacto</h2>
              </div>

              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-3 w-1/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : contactMessages && contactMessages.length > 0 ? (
                <div className="space-y-4">
                  {contactMessages.map((message) => (
                    <Card key={message.id} data-testid={`contact-message-${message.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {message.name}
                            </h3>
                            <p className="text-sm text-gray-600">{message.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={message.status === "UNREAD" ? "destructive" : "secondary"}>
                              {message.status === "UNREAD" ? "Sin leer" : "Leído"}
                            </Badge>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(message.createdAt, "d MMM yyyy - HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-claret-blue mb-1">
                            Asunto: {message.subject}
                          </p>
                          <p className="text-gray-700">{message.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-reply-message-${message.id}`}
                            onClick={() => {
                              toast({
                                title: "Responder mensaje",
                                description: `Funcionalidad de respuesta para: ${message.email}`,
                              });
                            }}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Responder
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-mark-read-${message.id}`}
                            onClick={() => {
                              const newStatus = message.status === "UNREAD" ? "READ" : "UNREAD";
                              updateMessageStatusMutation.mutate({ id: message.id, status: newStatus });
                            }}
                            disabled={updateMessageStatusMutation.isPending}
                          >
                            {message.status === "UNREAD" ? (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Marcar como leído
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Marcar como no leído
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay mensajes</h3>
                  <p className="text-gray-600">Los mensajes de contacto aparecerán aquí.</p>
                </div>
              )}
            </TabsContent>
          )}

          {/* Users Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-claret-blue">Gestión de Usuarios</h2>
              </div>
              
              <UserManagement />
            </TabsContent>
          )}

          {/* Validation Tab (Admin only) */}
          {isAdmin && (
            <TabsContent value="validation" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-claret-blue">Gestión de Validación</h2>
              </div>
              
              <ValidationStats />
              <ValidationManagement />
              <ValidationLogs />
            </TabsContent>
          )}
        </Tabs>
      </main>
      
      {/* Forms */}
      <CreatePostForm 
        isOpen={showCreatePostForm} 
        onClose={() => setShowCreatePostForm(false)} 
      />
      <CreatePlayForm 
        isOpen={showCreatePlayForm} 
        onClose={() => setShowCreatePlayForm(false)} 
      />
      <EditPlayForm 
        isOpen={showEditPlayForm} 
        onClose={() => {
          setShowEditPlayForm(false);
          setSelectedPlay(null);
        }}
        play={selectedPlay}
      />
      <EditPostForm 
        isOpen={showEditPostForm} 
        onClose={() => {
          setShowEditPostForm(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />
      
      {/* Showtime Management Modal */}
      {showShowtimeManagement && selectedPlay && (
        <ShowtimeManagement
          play={selectedPlay}
          onClose={() => {
            setShowShowtimeManagement(false);
            setSelectedPlay(null);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirmation} onOpenChange={() => setShowDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar obra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la obra y todos sus datos relacionados:
              <br />
              • Todas las entradas reservadas para esta obra
              <br />
              • Todos los showtimes adicionales
              <br />
              • La imagen del cartel (si existe)
              <br />
              <br />
              <strong>Esta acción no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirmation(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showDeleteConfirmation) {
                  deletePlayMutation.mutate(showDeleteConfirmation);
                  setShowDeleteConfirmation(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Play Statistics Modal */}
      {showStatisticsModal && (
        <PlayStatisticsModal
          playId={showStatisticsModal}
          isOpen={!!showStatisticsModal}
          onClose={() => setShowStatisticsModal(null)}
        />
      )}
      
      <Footer />
    </div>
  );
}
