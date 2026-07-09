import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import OfferingsSection from "@/components/OfferingsSection";

import EventsCalendarSection from "@/components/EventsCalendarSection";
import PastEventsSection from "@/components/PastEventsSection";
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
        {isAuthed && <SpotlightCard />}
        {isAuthed && <CelebrationsStrip />}
        {isAuthed && <CircleTeaser />}
        {isAuthed && <MeetupsSection />}
        <EventsCalendarSection />
        <PastEventsSection />
        <BecomingSpaceSection />
        <GallerySection />
        <SubstackFeedSection />
        {isAdmin && <ResourcesSection />}
        {isAuthed && <JoinSection />}
        {isAuthed && <TestimonialsSection />}
        {isAuthed && <FAQSection />}
      </main>
      <Footer />
      <FempowerCoach />
    </JoinGateProvider>
  );
};

export default Index;
