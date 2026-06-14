import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Pages that the user must be allowed to reach even while pending approval (e.g. /account/profile). */
  allowPending?: boolean;
}

export const ProtectedRoute = ({ children, allowPending = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useMemberProfile();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (loading || profileLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  const approved = profile?.status === "approved";
  if (!approved && !isAdmin && !allowPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};
