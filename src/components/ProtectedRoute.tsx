import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { isActiveMemberStatus } from "@/lib/memberProfile";
import { setMemberContext } from "@/lib/analytics";
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

  // This is the one place that already knows both facts, so it's the cheapest
  // place to tag replays with them — no extra queries anywhere else.
  useEffect(() => {
    if (profileLoading || adminLoading) return;
    setMemberContext({ status: profile?.status ?? "none", isAdmin });
  }, [profile?.status, isAdmin, profileLoading, adminLoading]);

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

  const active = isActiveMemberStatus(profile?.status);
  if (!active && !isAdmin && !allowPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};
