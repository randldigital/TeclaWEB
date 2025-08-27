import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className = "" }: BreadcrumbProps) {
  const [location] = useLocation();

  const getBreadcrumbItems = () => {
    const items: Array<{ name: string; href: string; icon?: typeof Home }> = [
      { name: "Inicio", href: "/", icon: Home }
    ];

    switch (location) {
      case "/obras":
        items.push({ name: "Obras", href: "/obras" });
        break;
      case "/galeria":
        items.push({ name: "Galería", href: "/galeria" });
        break;
      case "/contacto":
        items.push({ name: "Contacto", href: "/contacto" });
        break;
      case "/perfil":
        items.push({ name: "Perfil", href: "/perfil" });
        break;
      case "/admin":
        items.push({ name: "Administración", href: "/admin" });
        break;
    }

    return items;
  };

  const items = getBreadcrumbItems();

  // Don't show breadcrumb on home page
  if (location === "/") {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          <Link
            href={item.href}
            className={`flex items-center space-x-1 hover:text-claret-blue transition-colors ${
              index === items.length - 1 ? "text-claret-blue font-medium" : ""
            }`}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.name}</span>
          </Link>
        </div>
      ))}
    </nav>
  );
} 