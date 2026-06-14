const MAX_SCROLL_ATTEMPTS = 24;

export const scrollToHashTarget = (hash: string, attempt = 0) => {
  const id = decodeURIComponent(hash.replace(/^#/, ""));

  if (!id) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (attempt < MAX_SCROLL_ATTEMPTS) {
    window.requestAnimationFrame(() => scrollToHashTarget(hash, attempt + 1));
  }
};
