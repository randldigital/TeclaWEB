import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, AlertCircle } from "lucide-react";
import { Post } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PostDetail() {
  const { id } = useParams();
  
  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ["/api/posts", id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Post no encontrado");
        }
        throw new Error("Error al cargar el post");
      }
      return response.json();
    },
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-claret-yellow text-claret-navy";
      case "DRAFT":
        return "bg-gray-200 text-gray-700";
      case "HIDDEN":
        return "bg-claret-red text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Publicado";
      case "DRAFT":
        return "Borrador";
      case "HIDDEN":
        return "Oculto";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild
            className="text-claret-blue hover:text-claret-navy"
            data-testid="button-back-to-home"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-claret-red mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el post</h1>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <Button asChild className="bg-claret-blue hover:bg-claret-navy">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        ) : post ? (
          <article className="prose prose-lg max-w-none" data-testid={`post-detail-${post.id}`}>
            <div className="not-prose mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Badge className={getStatusColor(post.status)}>
                  {getStatusText(post.status)}
                </Badge>
                <span className="text-gray-500 text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(post.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-claret-blue mb-6">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
              
              {post.imageUrl && (
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg mb-8"
                />
              )}
            </div>
            
            <div 
              className="prose-headings:text-claret-blue prose-links:text-claret-blue hover:prose-links:text-claret-navy prose-strong:text-claret-navy"
              dangerouslySetInnerHTML={{ __html: post.content }}
              data-testid="post-content"
            />
            
            <div className="not-prose mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Teatro Claret Sevilla</span>
                </div>
                
                <Button asChild className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy">
                  <Link href="/#news">Ver más noticias</Link>
                </Button>
              </div>
            </div>
          </article>
        ) : null}
      </main>
      
      <Footer />
    </div>
  );
}
