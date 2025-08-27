import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { EventsSection } from "@/components/events-section";
import { useAuth } from "@/hooks/use-auth";

export default function ObrasPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb />
        </div>
        
        {/* Hero section for Obras page */}
        <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                🎭 Nuestras Obras
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
                Descubre las increíbles producciones teatrales del Colegio Claret Sevilla
              </p>
            </div>
          </div>
        </section>

        {/* Events/Plays Section */}
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
} 