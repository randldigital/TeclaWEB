import { Link } from "wouter";
import { Facebook, Instagram } from "lucide-react";

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
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <img 
                        src="/logo-color.png" 
                        alt="TECLA Logo" 
                        className="w-18 h-18"
                      />
                    </div>
              <div>
                <h4 className="text-xl font-bold">Escuela de Teatro TECLA</h4>
                <p className="text-sm text-blue-200">Sevilla</p>
              </div>
            </div>
            <p className="text-blue-200 mb-6 max-w-md">
              Formando jóvenes talentos en el arte teatral desde 2010. 
              Descubre la magia del teatro en el Colegio Claret Sevilla.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/escuelatecla/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 hover:text-claret-yellow transition-colors"
                aria-label="Instagram"
                data-testid="link-instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
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
              </a>
            </div>
          </div>
          <div>
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
          
        </div>
        
        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
          <p>&copy; {currentYear} Teatro Claret Sevilla. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
