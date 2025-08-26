import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Post } from "@shared/schema";

export function BlogSection() {
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const response = await fetch("/api/posts?limit=3&status=PUBLISHED");
      if (!response.ok) {
        throw new Error("Error al cargar las noticias");
      }
      return response.json();
    },
  });

  return (
    <section className="py-16 bg-gray-50" id="news">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-claret-blue mb-4">Últimas Noticias</h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mantente al día con las últimas novedades de nuestro teatro escolar
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
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
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-claret-red mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar las noticias</h4>
            <p className="text-gray-600">No se pudieron cargar las últimas noticias. Inténtalo de nuevo más tarde.</p>
          </div>
        ) : posts && posts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button 
                className="bg-claret-blue hover:bg-claret-navy text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-view-all-news"
              >
                Ver Todas las Noticias
              </Button>
            </div>
          </>
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
