import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Post } from "@shared/schema";
import { formatDate } from "@/utils/date-utils";

interface FeaturedPostProps {
  post: Post;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
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
    <article 
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
      data-testid={`featured-post-${post.id}`}
    >
      {post.imageUrl && (
        <div className="relative">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className={`${getStatusColor(post.status)} text-sm font-medium`}>
              {getStatusText(post.status)}
            </Badge>
          </div>
        </div>
      )}
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.createdAt, "EEEE, d 'de' MMMM 'de' yyyy")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>Teatro Claret</span>
          </div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-claret-blue mb-4 hover:text-claret-navy">
          <Link href={`/posts/${post.id}`} data-testid={`link-featured-post-${post.id}`}>
            {post.title}
          </Link>
        </h2>
        
        {post.excerpt && (
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        
        <div className="prose prose-lg max-w-none text-gray-700 mb-6">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button 
            variant="ghost" 
            className="text-claret-blue hover:text-claret-navy p-0 h-auto font-medium inline-flex items-center space-x-2"
            asChild
            data-testid={`button-read-more-featured-${post.id}`}
          >
            <Link href={`/posts/${post.id}`}>
              <span>Leer artículo completo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          
          <div className="text-sm text-gray-500">
            Última actualización: {formatDate(post.updatedAt, "d MMM yyyy")}
          </div>
        </div>
      </div>
    </article>
  );
} 