import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Join from "./pages/Join";
import AdminEvents from "./pages/AdminEvents";
import AdminEventPhotos from "./pages/AdminEventPhotos";
import AdminResources from "./pages/AdminResources";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminAllRegistrations from "./pages/AdminAllRegistrations";
import AdminTestimonials from "./pages/AdminTestimonials";
import AdminEmails from "./pages/AdminEmails";

import EventDetail from "./pages/EventDetail";
import MyTickets from "./pages/MyTickets";
import Directory from "./pages/Directory";
import MemberProfileEdit from "./pages/MemberProfileEdit";
import CoachHistory from "./pages/CoachHistory";
import AdminMembers from "./pages/AdminMembers";
import AdminImages from "./pages/AdminImages";
import Circle from "./pages/Circle";
import AdminCircle from "./pages/AdminCircle";
import Saved from "./pages/Saved";
import Meetups from "./pages/Meetups";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import LonelyInDubai from "./pages/LonelyInDubai";
import Roundtables from "./pages/Roundtables";
import WomenNetworkingDubai from "./pages/WomenNetworkingDubai";
import AiCoachForWomen from "./pages/AiCoachForWomen";
import TryChecklist from "./pages/TryChecklist";
import AdminZaraBroadcast from "./pages/AdminZaraBroadcast";
import AdminZaraStyle from "./pages/AdminZaraStyle";
import OAuthConsent from "./pages/OAuthConsent";
import Unsubscribe from "./pages/Unsubscribe";
import PendingApproval from "./pages/PendingApproval";
import Learn from "./pages/Learn";
import LearnCourse from "./pages/LearnCourse";
import LearnModule from "./pages/LearnModule";
import LearnWing from "./pages/LearnWing";
import LearnJournal from "./pages/LearnJournal";
import AdminLearn from "./pages/AdminLearn";
import ShareWin from "./pages/ShareWin";
import ShareMyStory from "./pages/ShareMyStory";
import AdminMilestones from "./pages/AdminMilestones";
import LifestyleManager from "./pages/LifestyleManager";
import ThePause from "./pages/ThePause";
import StarterKit from "./pages/StarterKit";
import AiEdge from "./pages/AiEdge";
import AdminAiEdge from "./pages/AdminAiEdge";
import AdminLifestyleManager from "./pages/AdminLifestyleManager";
import AdminNorthstar from "./pages/AdminNorthstar";
import ScrollToHash from "@/components/ScrollToHash";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import Analytics from "@/components/Analytics";
import { AdminRoute } from "@/components/AdminRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ScrollToHash />
        <Analytics />
        <OrganizationJsonLd />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/account/tickets" element={<MyTickets />} />
            <Route path="/account/saved" element={<Saved />} />
            <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
            <Route path="/account/profile" element={<ProtectedRoute allowPending><MemberProfileEdit /></ProtectedRoute>} />
            <Route path="/account/checklists" element={<ProtectedRoute allowPending><CoachHistory /></ProtectedRoute>} />

            <Route path="/pending-approval" element={<ProtectedRoute allowPending><PendingApproval /></ProtectedRoute>} />
            <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
            <Route path="/admin/images" element={<AdminRoute><AdminImages /></AdminRoute>} />
            <Route path="/admin/emails" element={<AdminRoute><AdminEmails /></AdminRoute>} />
            <Route path="/circle" element={<Circle />} />

            <Route path="/admin/circle" element={<AdminRoute><AdminCircle /></AdminRoute>} />
            <Route path="/meetups" element={<Meetups />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* Public content pages — indexed and prerendered, see PRERENDER_ROUTES in vite.config.ts */}
            <Route path="/lonely-in-dubai" element={<LonelyInDubai />} />
            <Route path="/roundtables" element={<Roundtables />} />
            <Route path="/women-networking-dubai" element={<WomenNetworkingDubai />} />
            <Route path="/ai-coach-for-women-uae" element={<AiCoachForWomen />} />
            <Route path="/try/:slug" element={<TryChecklist />} />
            <Route path="/admin/zara-broadcast" element={<AdminRoute><AdminZaraBroadcast /></AdminRoute>} />
            <Route path="/admin/zara-style" element={<AdminRoute><AdminZaraStyle /></AdminRoute>} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route
              path="/admin/events"
              element={
                <AdminRoute>
                  <AdminEvents />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/events/:eventId/registrations"
              element={
                <AdminRoute>
                  <AdminRegistrations />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/events/:eventId/photos"
              element={
                <AdminRoute>
                  <AdminEventPhotos />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/resources"
              element={
                <AdminRoute>
                  <AdminResources />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/registrations"
              element={
                <AdminRoute>
                  <AdminAllRegistrations />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/testimonials"
              element={
                <AdminRoute>
                  <AdminTestimonials />
                </AdminRoute>
              }
            />
            <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
            <Route path="/learn/journal" element={<ProtectedRoute><LearnJournal /></ProtectedRoute>} />
            <Route path="/learn/:courseId" element={<ProtectedRoute><LearnCourse /></ProtectedRoute>} />
            <Route path="/learn/:courseId/:moduleId" element={<ProtectedRoute><LearnModule /></ProtectedRoute>} />
            <Route path="/learn/:courseId/:moduleId/:wingId" element={<ProtectedRoute><LearnWing /></ProtectedRoute>} />
            <Route path="/share-win" element={<ProtectedRoute><ShareWin /></ProtectedRoute>} />
            <Route path="/share-my-story" element={<ProtectedRoute><ShareMyStory /></ProtectedRoute>} />
            <Route path="/admin/learn" element={<AdminRoute><AdminLearn /></AdminRoute>} />
            <Route path="/admin/milestones" element={<AdminRoute><AdminMilestones /></AdminRoute>} />
            <Route path="/lifestyle-manager" element={<ProtectedRoute><LifestyleManager /></ProtectedRoute>} />
            <Route path="/the-pause" element={<ProtectedRoute><ThePause /></ProtectedRoute>} />
            <Route path="/starter-kit" element={<ProtectedRoute><StarterKit /></ProtectedRoute>} />
            <Route path="/ai-edge" element={<ProtectedRoute><AiEdge /></ProtectedRoute>} />
            <Route path="/admin/ai-edge" element={<AdminRoute><AdminAiEdge /></AdminRoute>} />
            <Route path="/admin/lifestyle-manager" element={<AdminRoute><AdminLifestyleManager /></AdminRoute>} />
            <Route path="/admin/northstar" element={<AdminRoute><AdminNorthstar /></AdminRoute>} />
            <Route path="/programs" element={<Navigate to="/#programs" replace />} />
            <Route path="/events" element={<Navigate to="/#events-calendar" replace />} />
            <Route path="/join" element={<Join />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </AuthProvider>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
