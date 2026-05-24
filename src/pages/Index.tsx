import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import OfferingsSection from "@/components/OfferingsSection";
import ProgramsSection from "@/components/ProgramsSection";
import EventsCalendarSection from "@/components/EventsCalendarSection";
import BecomingSpaceSection from "@/components/BecomingSpaceSection";
import GallerySection from "@/components/GallerySection";
import ResourcesSection from "@/components/ResourcesSection";
import SubstackFeedSection from "@/components/SubstackFeedSection";
import NewsletterSection from "@/components/NewsletterSection";
import JoinSection from "@/components/JoinSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import FempowerCoach from "@/components/FempowerCoach";
import CircleTeaser from "@/components/CircleTeaser";
import MeetupsSection from "@/components/MeetupsSection";
import SchoolsTeaser from "@/components/SchoolsTeaser";
import SeoSummary from "@/components/SeoSummary";

const Index = () => (
  <>
    <Header />
    <main id="main">
      <SeoSummary />
      <HeroSection />
      <AboutSection />
      <OfferingsSection />
      <ProgramsSection />
      <CircleTeaser />
      <MeetupsSection />
      <EventsCalendarSection />
      <BecomingSpaceSection />
      <GallerySection />
      <SubstackFeedSection />
      <ResourcesSection />
      <SchoolsTeaser />
      {/* <NewsletterSection /> hidden for now */}
      <JoinSection />
      <TestimonialsSection />
      <FAQSection />
    </main>
    <Footer />
    <FempowerCoach />
  </>
);

export default Index;
