import { forwardRef, type MouseEvent } from "react";
import { Link, type LinkProps, useLocation, useNavigate } from "react-router-dom";
import { scrollToHashTarget } from "@/lib/hashNavigation";

const isPlainLeftClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey;

const parseHashTarget = (to: LinkProps["to"], currentPathname: string) => {
  if (typeof to !== "string" || !to.includes("#")) return null;

  const [rawPath, rawHash] = to.split("#");
  if (!rawHash) return null;

  return {
    pathname: rawPath || currentPathname,
    hash: `#${rawHash}`,
  };
};

const HashLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ onClick, target, to, ...props }, ref) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || target || !isPlainLeftClick(event)) return;

      const destination = parseHashTarget(to, location.pathname);
      if (!destination || destination.pathname !== location.pathname) return;

      event.preventDefault();
      navigate(`${destination.pathname}${destination.hash}`);
      scrollToHashTarget(destination.hash);
    };

    return <Link ref={ref} to={to} target={target} onClick={handleClick} {...props} />;
  },
);

HashLink.displayName = "HashLink";

export default HashLink;
