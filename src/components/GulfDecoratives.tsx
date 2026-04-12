/** Subtle UAE / Gulf-themed SVG decorative elements */

/** A minimal palm frond divider — horizontal rule with a single date palm leaf */
export const PalmDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-4 ${className}`}>
    <span className="flex-1 max-w-[80px] h-px bg-border" />
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" className="text-blush-dark opacity-60">
      {/* date palm frond */}
      <path d="M32 58V28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 28C28 20 18 14 10 16C18 18 26 24 32 28Z" fill="currentColor" opacity=".35"/>
      <path d="M32 28C36 20 46 14 54 16C46 18 38 24 32 28Z" fill="currentColor" opacity=".35"/>
      <path d="M32 24C30 16 24 8 16 6C24 10 30 18 32 24Z" fill="currentColor" opacity=".25"/>
      <path d="M32 24C34 16 40 8 48 6C40 10 34 18 32 24Z" fill="currentColor" opacity=".25"/>
      <path d="M32 20C31 14 28 6 22 2C28 6 31 14 32 20Z" fill="currentColor" opacity=".2"/>
      <path d="M32 20C33 14 36 6 42 2C36 6 33 14 32 20Z" fill="currentColor" opacity=".2"/>
    </svg>
    <span className="flex-1 max-w-[80px] h-px bg-border" />
  </div>
);

/** Desert sand dune wave — a subtle bottom-of-section decorative */
export const DuneWave = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" className={`w-full h-[40px] md:h-[60px] ${className}`}>
    <path
      d="M0 80 C240 20, 480 60, 720 30 C960 0, 1200 50, 1440 20 L1440 80 Z"
      className="fill-secondary/40"
    />
    <path
      d="M0 80 C300 40, 540 70, 780 45 C1020 20, 1260 60, 1440 35 L1440 80 Z"
      className="fill-background"
    />
  </svg>
);

/** Small inline UAE skyline silhouette — Burj Khalifa + mosque dome hint */
export const SkylineSilhouette = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 320 60" fill="none" className={`w-full max-w-xs h-auto opacity-[0.07] ${className}`}>
    {/* Burj Khalifa */}
    <path d="M160 2 L162 50 L158 50 Z" fill="currentColor"/>
    <rect x="156" y="50" width="8" height="10" fill="currentColor"/>
    {/* Building cluster left */}
    <rect x="120" y="30" width="12" height="30" rx="1" fill="currentColor"/>
    <rect x="100" y="35" width="10" height="25" rx="1" fill="currentColor"/>
    <rect x="134" y="38" width="14" height="22" rx="1" fill="currentColor"/>
    {/* Building cluster right */}
    <rect x="168" y="32" width="14" height="28" rx="1" fill="currentColor"/>
    <rect x="186" y="36" width="10" height="24" rx="1" fill="currentColor"/>
    <rect x="200" y="40" width="12" height="20" rx="1" fill="currentColor"/>
    {/* Mosque dome */}
    <ellipse cx="80" cy="48" rx="16" ry="12" fill="currentColor"/>
    <rect x="72" y="48" width="16" height="12" fill="currentColor"/>
    {/* Minaret */}
    <rect x="62" y="34" width="4" height="26" fill="currentColor"/>
    <circle cx="64" cy="33" r="3" fill="currentColor"/>
    {/* Ground line */}
    <rect x="40" y="58" width="240" height="2" rx="1" fill="currentColor"/>
  </svg>
);

/** A tiny crescent + star icon */
export const CrescentStar = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M15.5 12a7.5 7.5 0 1 1-5-7.07 5.5 5.5 0 0 0 0 14.14A7.48 7.48 0 0 1 15.5 12Z" fill="currentColor" opacity=".6"/>
    <path d="M18.5 6l.5 1.5L20.5 8l-1.5.5L18.5 10l-.5-1.5L16.5 8l1.5-.5Z" fill="currentColor" opacity=".6"/>
  </svg>
);
