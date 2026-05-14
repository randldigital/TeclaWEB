import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginModal } from "@/components/login-modal";

export function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Obras", href: "/obras" },
    { name: "Galería", href: "/galeria" },
    { name: "Contacto", href: "/contacto" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b-2 border-claret-yellow sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0 gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink" data-testid="link-home">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <img 
                  src="/logo-color.png" 
                  alt="TECLA Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-shrink">
                <h1 className="text-sm sm:text-lg font-bold text-claret-blue truncate">Escuela de Teatro TECLA</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Sevilla</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    location === item.href ? "text-claret-blue font-medium" : "text-gray-700"
                  } hover:text-claret-blue transition-colors`}
                  data-testid={`link-nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-claret-blue text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/perfil">
                        <User className="w-4 h-4 mr-2" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    {(user.role === "ADMIN" || user.role === "MONITOR") && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Settings className="w-4 h-4 mr-2" />
                          <span>Administración</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-claret-yellow hover:bg-claret-yellow-dark text-claret-navy font-medium text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap"
                  data-testid="button-open-login"
                >
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <span className="sm:hidden">Entrar</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 sm:w-80 md:w-96">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-left text-gray-700 hover:text-claret-blue transition-colors py-2"
                        data-testid={`link-mobile-nav-${item.name.toLowerCase()}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}
