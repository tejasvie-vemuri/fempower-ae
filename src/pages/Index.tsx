import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import OfferingsSection from "@/components/OfferingsSection";
import ProgramsSection from "@/components/ProgramsSection";
import EventsCalendarSection from "@/components/EventsCalendarSection";
import GallerySection from "@/components/GallerySection";
import ResourcesSection from "@/components/ResourcesSection";
import NewsletterSection from "@/components/NewsletterSection";
import JoinSection from "@/components/JoinSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => (
  <>
    <Header />
    <main>
      <HeroSection />
      <AboutSection />
      <OfferingsSection />
      <ProgramsSection />
      <EventsCalendarSection />
      <GallerySection />
      <ResourcesSection />
      <NewsletterSection />
      <JoinSection />
      <TestimonialsSection />
      <FAQSection />
    </main>
    <Footer />
  </>
);

export default Index;
