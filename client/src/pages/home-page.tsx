import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BlogSection } from "@/components/blog-section";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Theater, 
  ArrowRight,
  Calendar,
  Clock
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero section for Blog/Home page */}
        <section className="bg-gradient-to-br from-green-600 to-teal-600 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                📰 Blog Teatral
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
                Noticias, artículos y novedades sobre nuestro teatro escolar
              </p>
              
              {/* Direct link to Obras */}
              <div className="flex justify-center">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Theater className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">¿Buscas nuestras obras?</h3>
                        <p className="text-white/80 text-sm">Descubre las próximas funciones y reserva tus entradas</p>
                      </div>
                      <Button
                        onClick={() => setLocation('/obras')}
                        className="bg-white text-green-600 hover:bg-white/90 font-medium"
                      >
                        Ver Obras
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}
