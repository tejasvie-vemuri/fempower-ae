import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import OfferingsSection from "@/components/OfferingsSection";
import ProgramsSection from "@/components/ProgramsSection";
import EventsCalendarSection from "@/components/EventsCalendarSection";
import BecomingSpaceSection from "@/components/BecomingSpaceSection";
import GallerySection from "@/components/GallerySection";
import ResourcesSection from "@/components/ResourcesSection";
import JoinSection from "@/components/JoinSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import FempowerCoach from "@/components/FempowerCoach";
import CircleTeaser from "@/components/CircleTeaser";
import MeetupsSection from "@/components/MeetupsSection";
import SubstackFeedSection from "@/components/SubstackFeedSection";
import SeoSummary from "@/components/SeoSummary";
import HomeStructuredData from "@/components/HomeStructuredData";
import CelebrationsStrip from "@/components/CelebrationsStrip";
import SpotlightCard from "@/components/SpotlightCard";
import { JoinGateProvider } from "@/components/JoinGate";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const Index = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isAuthed = !!user;

  return (
    <JoinGateProvider>
      <Header />
      <main id="main">
        <HomeStructuredData />
        <SeoSummary />
        <HeroSection />
        <OfferingsSection />
        <ProgramsSection />
        {isAuthed && <SpotlightCard />}
        {isAuthed && <CelebrationsStrip />}
        <CircleTeaser />
        <MeetupsSection />
        <EventsCalendarSection />
        <BecomingSpaceSection />
        <GallerySection />
        <SubstackFeedSection />
        {isAdmin && <ResourcesSection />}
        <JoinSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />
      <FempowerCoach />
    </JoinGateProvider>
  );
};

export default Index;
