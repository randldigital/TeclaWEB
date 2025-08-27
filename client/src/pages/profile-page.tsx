import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Mail, 
  Calendar, 
  Ticket, 
  ArrowLeft,
  Edit,
  Shield,
  Clock,
  Download
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/tickets?userId=${user.id}`);
      if (!response.ok) {
        throw new Error("Error al cargar las entradas");
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch plays for ticket details
  const { data: plays } = useQuery({
    queryKey: ["/api/plays"],
    queryFn: async () => {
      const response = await fetch("/api/plays");
      if (!response.ok) {
        throw new Error("Error al cargar las obras");
      }
      return response.json();
    },
  });

  const getRoleText = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "MONITOR":
        return "Monitor";
      case "USER":
        return "Usuario";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-claret-red text-white";
      case "MONITOR":
        return "bg-claret-blue text-white";
      case "USER":
        return "bg-claret-yellow text-claret-navy";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const safeFormatDate = (dateValue: string | Date | undefined, formatString: string) => {
    if (!dateValue) return "Fecha no disponible";
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, formatString, { locale: es });
    } catch (error) {
      return "Fecha no disponible";
    }
  };

  const downloadTicket = async (ticketId: string, useCustomTemplate: boolean = false) => {
    try {
      const method = useCustomTemplate ? 'POST' : 'GET';
      const response = await fetch(`/api/tickets/${ticketId}/pdf`, {
        method,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar la entrada. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">Necesitas iniciar sesión para acceder a tu perfil.</p>
            <Button asChild className="bg-claret-blue hover:bg-claret-navy">
              <Link href="/auth">Iniciar Sesión</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb />
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild
            className="text-claret-blue hover:text-claret-navy"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-claret-blue text-white text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="text-lg">{user.email}</CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(user.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleText(user.role)}
                    </Badge>
                                          <span className="text-sm text-gray-500">
                        Miembro desde {safeFormatDate(user.createdAt, "MMMM yyyy")}
                      </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información de la Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Fecha de Registro</p>
                    <p className="text-sm text-gray-600">
                      {safeFormatDate(user.createdAt, "d 'de' MMMM 'de' yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Última Actualización</p>
                    <p className="text-sm text-gray-600">
                      {safeFormatDate(user.updatedAt, "d 'de' MMMM 'de' yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Rol</p>
                    <p className="text-sm text-gray-600">{getRoleText(user.role)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Ticket className="w-5 h-5 mr-2" />
                Mis Entradas
              </CardTitle>
              <CardDescription>
                Historial de entradas reservadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="w-12 h-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket: any) => {
                    const play = plays?.find((p: any) => p.id === ticket.playId);
                                         return (
                       <div key={ticket.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                         <div className="w-12 h-12 bg-claret-blue rounded-lg flex items-center justify-center">
                           <Ticket className="w-6 h-6 text-white" />
                         </div>
                         <div className="flex-1">
                           <h4 className="font-medium text-gray-900">
                             {play?.title || "Obra no encontrada"}
                           </h4>
                           <p className="text-sm text-gray-600">
                             {safeFormatDate(play?.dateTime, "d 'de' MMMM 'de' yyyy 'a las' HH:mm")}
                           </p>
                           <p className="text-xs text-gray-500">
                             ID: {ticket.id}
                           </p>
                         </div>
                         <div className="flex items-center space-x-2">
                           <Badge variant="outline" className="text-xs">
                             {ticket.status}
                           </Badge>
                           <div className="flex space-x-1">
                             <Button
                               onClick={() => downloadTicket(ticket.id, false)}
                               size="sm"
                               variant="outline"
                               className="h-8 w-8 p-0"
                               title="Descargar entrada original"
                             >
                               <Download className="w-3 h-3" />
                             </Button>
                             <Button
                               onClick={() => downloadTicket(ticket.id, true)}
                               size="sm"
                               variant="outline"
                               className="h-8 w-8 p-0"
                               title="Descargar entrada personalizada"
                             >
                               <Download className="w-3 h-3" />
                             </Button>
                           </div>
                         </div>
                       </div>
                     );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No tienes entradas</h4>
                  <p className="text-gray-600 mb-4">Aún no has reservado ninguna entrada para nuestras obras.</p>
                  <Button asChild className="bg-claret-blue hover:bg-claret-navy">
                    <Link href="/obras">Ver Obras</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
} 