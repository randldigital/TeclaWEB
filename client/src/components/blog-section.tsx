import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { FeaturedPost } from "@/components/featured-post";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Instagram, Music } from "lucide-react";
import { Post } from "@shared/schema";

export function BlogSection() {
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const response = await fetch("/api/posts?limit=6&status=PUBLISHED");
      if (!response.ok) {
        throw new Error("Error al cargar las noticias");
      }
      return response.json();
    },
  });

  const featuredPost = posts && posts.length > 0 ? posts[0] : null;
  const olderPosts = posts && posts.length > 1 ? posts.slice(1) : [];

  return (
    <section className="py-16 bg-white" id="news">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <h3 className="text-3xl font-bold text-claret-blue">Últimas Noticias</h3>
            <div className="flex gap-3">
              {/* Instagram Button */}
              <Button
                asChild
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <a 
                  href="https://www.instagram.com/escuelatecla/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span className="hidden sm:inline">Síguenos en Instagram</span>
                </a>
              </Button>
              
              {/* TikTok Button */}
              <Button
                asChild
                className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <a 
                href="https://www.tiktok.com/@escuela_tecla" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-claret-yellow transition-colors"
                aria-label="TikTok"
                data-testid="link-tiktok"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                  <span className="hidden sm:inline">¡Y en TikTok!</span>
                </a>
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ¡Mantente al día con las últimas novedades!
          </p>
        </div>
        
        {isLoading ? (
          <div className="space-y-12">
            {/* Featured post skeleton */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <Skeleton className="w-full h-64 md:h-80" />
              <div className="p-8 space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
            
            {/* Older posts skeleton */}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-8">Noticias Anteriores</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-claret-red mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar las noticias</h4>
            <p className="text-gray-600">No se pudieron cargar las últimas noticias. Inténtalo de nuevo más tarde.</p>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Post */}
            {featuredPost && (
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-6">Noticia Destacada</h4>
                <FeaturedPost post={featuredPost} />
              </div>
            )}
            
            {/* Older Posts */}
            {olderPosts.length > 0 && (
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-8">Noticias Anteriores</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {olderPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                
                {posts.length >= 6 && (
                  <div className="text-center mt-10">
                    <Button 
                      className="bg-claret-blue hover:bg-claret-navy text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                      data-testid="button-view-all-news"
                    >
                      Ver Más Noticias
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay noticias disponibles</h4>
            <p className="text-gray-600">No hay noticias publicadas en este momento.</p>
          </div>
        )}
      </div>
    </section>
  );
}
