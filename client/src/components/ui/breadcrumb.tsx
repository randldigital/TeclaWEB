import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ items = [] }: BreadcrumbProps) {
  const [location] = useLocation();

  // Auto-generate breadcrumbs based on current location if no items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home
    breadcrumbs.push({ label: 'Inicio', href: '/' });

    // Add path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Map segment to readable label
      const labelMap: Record<string, string> = {
        'obras': 'Obras',
        'blog': 'Blog',
        'galeria': 'Galería',
        'contacto': 'Contacto',
        'perfil': 'Perfil',
        'admin': 'Administración',
        'validacion': 'Validación',
        'qr-validator': 'Validación Manual',
        'auth': 'Autenticación',
        'events': 'Eventos',
        'posts': 'Posts'
      };

      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Don't add href for the last segment (current page)
      if (index === pathSegments.length - 1) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index === 0 ? (
            <Home className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4 mx-1" />
          )}
          
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-claret-blue transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
