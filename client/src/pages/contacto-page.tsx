import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactSection } from "@/components/contact-section";
import { useAuth } from "@/hooks/use-auth";

export default function ContactoPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero section for Contacto page */}
        <section className="bg-gradient-to-br from-orange-600 to-red-600 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                📞 Contacto
              </h1>
              <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
                Ponte en contacto con nosotros para más información sobre nuestro teatro
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
} 