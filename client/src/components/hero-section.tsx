import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export function HeroSection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const scrollToEvents = () => {
    const element = document.querySelector("#events");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAuthAction = () => {
    if (user) {
      scrollToEvents();
    } else {
      setLocation("/auth");
    }
  };

  return (
    <section className="bg-gradient-to-br from-claret-blue via-claret-navy to-claret-blue py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Vive la <span className="text-claret-yellow">Magia</span><br />
            del Teatro
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Descubre nuestras obras, reserva tus entradas y forma parte de la comunidad teatral del Colegio Claret Sevilla
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={scrollToEvents}
              className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
              size="lg"
              data-testid="button-view-events"
            >
              Ver Próximas Obras
            </Button>
            <Button
              onClick={handleAuthAction}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-claret-blue px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              size="lg"
              data-testid="button-register-or-events"
            >
              {user ? "Reservar Entradas" : "Crear Cuenta"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
