import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import AdminEvents from "./pages/AdminEvents";
import AdminRegistrations from "./pages/AdminRegistrations";
import EventDetail from "./pages/EventDetail";
import MyTickets from "./pages/MyTickets";
import Directory from "./pages/Directory";
import MemberProfileEdit from "./pages/MemberProfileEdit";
import AdminMembers from "./pages/AdminMembers";
import AdminImages from "./pages/AdminImages";
import Circle from "./pages/Circle";
import AdminCircle from "./pages/AdminCircle";
import Meetups from "./pages/Meetups";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Schools from "./pages/Schools";
import AdminSchools from "./pages/AdminSchools";
import { AdminRoute } from "@/components/AdminRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/account/tickets" element={<MyTickets />} />
            <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
            <Route path="/account/profile" element={<ProtectedRoute><MemberProfileEdit /></ProtectedRoute>} />
            <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
            <Route path="/admin/images" element={<AdminRoute><AdminImages /></AdminRoute>} />
            <Route path="/circle" element={<Circle />} />
            <Route path="/admin/circle" element={<AdminRoute><AdminCircle /></AdminRoute>} />
            <Route path="/meetups" element={<Meetups />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/admin/schools" element={<AdminRoute><AdminSchools /></AdminRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
