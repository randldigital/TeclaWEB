import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import ObrasPage from "@/pages/obras-page";
import GaleriaPage from "@/pages/galeria-page";
import ContactoPage from "@/pages/contacto-page";
import ProfilePage from "@/pages/profile-page";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/admin-dashboard";
import EventDetail from "@/pages/event-detail";
import PostDetail from "@/pages/post-detail";
import ValidacionPage from "@/pages/validacion";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/obras" component={ObrasPage} />
      <Route path="/galeria" component={GaleriaPage} />
      <Route path="/contacto" component={ContactoPage} />
      <Route path="/perfil" component={ProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/posts/:id" component={PostDetail} />
      <Route path="/validacion" component={ValidacionPage} />
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        roles={["ADMIN", "MONITOR"]}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
