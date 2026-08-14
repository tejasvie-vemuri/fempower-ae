/**
 * Mounts the analytics pipeline for the whole app.
 *
 * Rendered once inside <AuthProvider> (so it can see the session) and inside
 * the router (so it can see navigation). Renders nothing, and every side
 * effect lives in an effect — the public routes are prerendered through
 * `renderToString`, where `window` does not exist.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  identifyMember,
  initAnalytics,
  resetIdentity,
  track,
  trackPageView,
} from "@/lib/analytics";
import { notifyRouteChange, startAutoCapture } from "@/lib/analytics/autoCapture";
import { startWebVitals } from "@/lib/analytics/webVitals";

const Analytics = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const previousUserId = useRef<string | null>(null);
  const anonymousTagged = useRef(false);

  /* Boot once: Clarity tag, delegated listeners, Web Vitals observers. */
  useEffect(() => {
    initAnalytics();
    const stopAutoCapture = startAutoCapture();
    const stopWebVitals = startWebVitals();
    return () => {
      stopAutoCapture();
      stopWebVitals();
    };
  }, []);

  /* Page views. `location.key` changes even when navigating to the same path. */
  useEffect(() => {
    const path = location.pathname;
    trackPageView(path, location.search);
    notifyRouteChange(path);
  }, [location.pathname, location.search, location.key]);

  /* Identity: tie the replay to a member, and notice sign-out. */
  useEffect(() => {
    if (loading) return;
    const previous = previousUserId.current;

    if (user) {
      if (previous !== user.id) {
        identifyMember({
          userId: user.id,
          provider: user.app_metadata?.provider,
          createdAt: user.created_at,
        });
      }
      previousUserId.current = user.id;
      return;
    }

    // Anonymous. Only re-tag on the transition, so a logged-out visitor
    // browsing ten pages doesn't send ten identical tag updates.
    if (previous) track("sign_out");
    if (previous || !anonymousTagged.current) {
      resetIdentity();
      anonymousTagged.current = true;
    }
    previousUserId.current = null;
  }, [user, loading]);

  return null;
};

export default Analytics;
