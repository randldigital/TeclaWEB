import { Link } from "wouter";
import { Theater, Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-claret-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-claret-yellow rounded-lg flex items-center justify-center">
                <Theater className="w-6 h-6 text-claret-navy" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Teatro Claret</h4>
                <p className="text-sm text-blue-200">Sevilla</p>
              </div>
            </div>
            <p className="text-blue-200 mb-6 max-w-md">
              Formando jóvenes talentos en el arte teatral desde 1985. 
              Descubre la magia del teatro en el Colegio Claret Sevilla.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-blue-200 hover:text-claret-yellow transition-colors"
                aria-label="Facebook"
                data-testid="link-facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-blue-200 hover:text-claret-yellow transition-colors"
                aria-label="Instagram"
                data-testid="link-instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-blue-200 hover:text-claret-yellow transition-colors"
                aria-label="YouTube"
                data-testid="link-youtube"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h5 className="font-semibold mb-4">Navegación</h5>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-blue-200 hover:text-white transition-colors" data-testid="link-footer-home">
                  Inicio
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("#events")}
                  className="text-blue-200 hover:text-white transition-colors"
                  data-testid="link-footer-events"
                >
                  Obras
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("#gallery")}
                  className="text-blue-200 hover:text-white transition-colors"
                  data-testid="link-footer-gallery"
                >
                  Galería
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("#contact")}
                  className="text-blue-200 hover:text-white transition-colors"
                  data-testid="link-footer-contact"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h5 className="font-semibold mb-4">Información</h5>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors" data-testid="link-footer-workshops">
                  Talleres
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors" data-testid="link-footer-admissions">
                  Admisiones
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors" data-testid="link-footer-faq">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-200 hover:text-white transition-colors" data-testid="link-footer-privacy">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
          <p>&copy; {currentYear} Teatro Claret Sevilla. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
