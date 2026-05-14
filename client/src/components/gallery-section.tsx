import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Expand, Instagram, X } from "lucide-react";
import { GalleryItem } from "@shared/schema";
import { useState } from "react";

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
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const openFullScreen = (item: GalleryItem) => {
    setSelectedImage(item);
  };

  const closeFullScreen = () => {
    setSelectedImage(null);
  };

  return (
    <section className="py-16 bg-gray-50" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {/* Hero + Grid Hybrid Layout */}
            <div className="space-y-8">
              {/* Hero Image - Featured Post */}
              {displayItems.length > 0 && (
                <div className="relative group cursor-pointer" onClick={() => openFullScreen(displayItems[0])}>
                  <div className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-3 bg-white">
                    <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                      <img 
                        src={displayItems[0].imageUrl} 
                        alt={displayItems[0].title}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 transform scale-75 group-hover:scale-100 transition-transform duration-700">
                        <Expand className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    {displayItems[0].title && (
                      <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                        <h3 className="text-white font-bold text-2xl md:text-3xl mb-3">{displayItems[0].title}</h3>
                        <div className="w-16 h-1 bg-claret-yellow rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid - Remaining Posts */}
              {displayItems.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayItems.slice(1).map((item) => (
                    <div 
                      key={item.id} 
                      className="relative group cursor-pointer"
                      data-testid={`gallery-item-${item.id}`}
                      onClick={() => openFullScreen(item)}
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
                        <div className="aspect-square flex items-center justify-center p-4 bg-gray-50">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                            <Expand className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        {item.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                            <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                            <div className="w-12 h-1 bg-claret-yellow rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          <>
            {/* Static Gallery Images as Fallback */}
            {/* Hero + Grid Hybrid Layout - Static Fallback */}
            <div className="space-y-8">
              {/* Hero Image - Featured Post */}
              <div className="relative group cursor-pointer" onClick={() => openFullScreen({ id: 'static-1', imageUrl: '/attached_assets/teclagaleria1.jpg', title: 'La Prueba' } as GalleryItem)}>
                <div className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-3 bg-white">
                  <div className="aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                    <img 
                      src="/attached_assets/teclagaleria1.jpg" 
                      alt="La Prueba"
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 transform scale-75 group-hover:scale-100 transition-transform duration-700">
                      <Expand className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                    <h3 className="text-white font-bold text-2xl md:text-3xl mb-3">La Prueba</h3>
                    <p className="text-white/90 text-lg mb-4">Representación de 2025</p>
                    <div className="w-16 h-1 bg-claret-yellow rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Grid - Remaining Posts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { src: "/attached_assets/teclagaleria2.jpg", title: "Cuento de Navidad", description: "Representación de 2025" },
                  { src: "/attached_assets/teclagaleria4.jpg", title: "La Soga", description: "Representación de 2025" },
                  { src: "/attached_assets/teclagaleria5.jpg", title: "La Casa de Bernarda Alba", description: "Representación de 2025" }
                ].map((image, index) => (
                  <div 
                    key={`static-gallery-${index + 1}`}
                    className="relative group cursor-pointer"
                    onClick={() => openFullScreen({ id: `static-${index + 2}`, imageUrl: image.src, title: image.title } as GalleryItem)}
                  >
                    <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
                      <div className="aspect-square flex items-center justify-center p-4 bg-gray-50">
                        <img 
                          src={image.src} 
                          alt={image.title}
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                          <Expand className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-white font-bold text-lg mb-2">{image.title}</h3>
                        <p className="text-white/90 text-sm mb-3 line-clamp-2">{image.description}</p>
                        <div className="w-12 h-1 bg-claret-yellow rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Nuestro fotógrafo oficial es{" "}
                <span className="text-claret-blue">@fvphotoshoot</span>
                <br />
                Te invitamos a seguirlo en Instagram
              </h4>
              <div className="flex justify-center mb-6">
                <a 
                  href="https://www.instagram.com/fvphotoshoot/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  aria-label="Instagram"
                  data-testid="link-instagram"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="font-semibold">Instagram</span>
                </a>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Para acceder a la galería completa de una representación en particular, 
                puedes contactar con nosotros a través de nuestro formulario de contacto.
              </p>
            </div>

          </>
        )}
      </div>

      {/* Full Screen Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={closeFullScreen}>
          <div className="relative max-w-7xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeFullScreen}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              {selectedImage.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-white font-bold text-xl">{selectedImage.title}</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
