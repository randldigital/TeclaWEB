import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Expand } from "lucide-react";
import { GalleryItem } from "@shared/schema";

export function GallerySection() {
  const { data: galleryItems, isLoading, error } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      const response = await fetch("/api/gallery?visibility=PUBLIC");
      if (!response.ok) {
        throw new Error("Error al cargar la galería");
      }
      return response.json();
    },
  });

  const displayItems = galleryItems?.slice(0, 6) || [];

  return (
    <section className="py-16 bg-gray-50" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-claret-blue mb-4">Galería</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Revive los mejores momentos de nuestras representaciones teatrales
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="w-full h-64 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-claret-red mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar la galería</h4>
            <p className="text-gray-600">No se pudo cargar la galería. Inténtalo de nuevo más tarde.</p>
          </div>
        ) : displayItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayItems.map((item) => (
                <div 
                  key={item.id} 
                  className="relative group cursor-pointer rounded-xl overflow-hidden"
                  data-testid={`gallery-item-${item.id}`}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <Expand className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white font-medium">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button 
                className="bg-claret-blue hover:bg-claret-navy text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-view-all-gallery"
              >
                Ver Toda la Galería
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Galería en construcción</h4>
            <p className="text-gray-600">Próximamente añadiremos fotos de nuestras representaciones.</p>
          </div>
        )}
      </div>
    </section>
  );
}
