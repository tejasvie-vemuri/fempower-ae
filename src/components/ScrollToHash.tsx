import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToHash = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);

  return null;
};

export default ScrollToHash;
