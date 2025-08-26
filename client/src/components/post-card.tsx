import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Post } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
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
      data-testid={`post-card-${post.id}`}
    >
      {post.imageUrl && (
        <img 
          src={post.imageUrl} 
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-3">
          <Badge className={getStatusColor(post.status)}>
            {getStatusText(post.status)}
          </Badge>
          <span className="text-gray-500 text-sm">
            {format(new Date(post.createdAt), "d MMM yyyy", { locale: es })}
          </span>
        </div>
        <h4 className="text-xl font-semibold text-claret-blue mb-3 hover:text-claret-navy">
          <Link href={`/posts/${post.id}`} data-testid={`link-post-${post.id}`}>
            {post.title}
          </Link>
        </h4>
        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <Button 
          variant="ghost" 
          className="text-claret-blue hover:text-claret-navy p-0 h-auto font-medium inline-flex items-center space-x-1"
          asChild
          data-testid={`button-read-more-${post.id}`}
        >
          <Link href={`/posts/${post.id}`}>
            <span>Leer más</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
