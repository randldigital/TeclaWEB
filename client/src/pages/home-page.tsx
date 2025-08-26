import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/hero-section";
import { BlogSection } from "@/components/blog-section";
import { EventsSection } from "@/components/events-section";
import { GallerySection } from "@/components/gallery-section";
import { ContactSection } from "@/components/contact-section";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // If user is already logged in and on home page, show main content
  useEffect(() => {
    // Only redirect if trying to access auth while logged in
    // Home page should be accessible to everyone
  }, [user]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <BlogSection />
        <EventsSection />
        <GallerySection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
