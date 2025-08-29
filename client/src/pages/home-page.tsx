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
        <section className="bg-gradient-to-br from-blue-300 to-white text-gray-800 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src="/banner.png" 
                  alt="TECLA Banner" 
                  className="max-w-full h-auto max-h-32 md:max-h-48 object-contain drop-shadow-lg"
                />
              </div>
              
              {/* Direct link to Obras */}
              <div className="flex justify-center">
                <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Theater className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-800">¿Buscas nuestras obras?</h3>
                        <p className="text-gray-600 text-sm">Descubre las próximas funciones y reserva tus entradas</p>
                      </div>
                      <Button
                        onClick={() => setLocation('/obras')}
                        className="bg-blue-600 text-white hover:bg-blue-700 font-medium"
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
