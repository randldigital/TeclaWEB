import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { ChristmasEffects } from "@/components/christmas-effects";
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
import QrValidatorPage from "@/pages/qr-validator";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/obras" component={ObrasPage} />

      <Route path="/galeria" component={GaleriaPage} />
      <Route path="/contacto" component={ContactoPage} />
      <ProtectedRoute path="/perfil" component={ProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/posts/:id" component={PostDetail} />
      <ProtectedRoute path="/validacion" component={ValidacionPage} roles={["ADMIN", "MONITOR"]} />
      <ProtectedRoute path="/qr-validator" component={QrValidatorPage} roles={["ADMIN", "MONITOR"]} />
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <ChristmasEffects />
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
