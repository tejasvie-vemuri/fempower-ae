import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToHashTarget } from "@/lib/hashNavigation";

const ScrollToHash = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const frame = window.requestAnimationFrame(() => scrollToHashTarget(hash));

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);

  return null;
};

export default ScrollToHash;
