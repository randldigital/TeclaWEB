import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GallerySection } from "@/components/gallery-section";
import { useAuth } from "@/hooks/use-auth";

export default function GaleriaPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero section for Galería page */}
        <section className="bg-gradient-to-br from-pink-600 to-rose-600 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                📸 Galería
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
                Momentos especiales y recuerdos de nuestras producciones teatrales
              </p>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <GallerySection />
      </main>
      <Footer />
    </div>
  );
} 