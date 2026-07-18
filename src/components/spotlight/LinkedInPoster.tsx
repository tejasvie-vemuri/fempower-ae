import { forwardRef } from "react";

/**
 * Off-screen 1080×1080 poster used by html-to-image to render a shareable
 * LinkedIn asset — magazine-style, echoing "The Audacious Chronicles" layout.
 * Kept fully self-contained (no Tailwind theme tokens) so html-to-image can
 * capture it without cross-origin CSS loading issues.
 */

export interface LinkedInPosterProps {
  memberName: string;
  photoUrl: string | null;
  headline: string;
  roleCompany: string;
  identityTag: string;
  stoppedWaitingFor: string;
  pullQuote: string;
  rallyLine: string;
  issueLabel?: string;
}

const PLUM = "#4A2040";
const GOLD = "#D4A853";
const IVORY = "#FDF8F3";
const INK = "#1A1A1A";

export const POSTER_SIZE = 1080;

export const LinkedInPoster = forwardRef<HTMLDivElement, LinkedInPosterProps>(
  (
    {
      memberName,
      photoUrl,
      headline,
      roleCompany,
      identityTag,
      stoppedWaitingFor,
      pullQuote,
      rallyLine,
      issueLabel,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        style={{
          width: POSTER_SIZE,
          height: POSTER_SIZE,
          background: IVORY,
          color: INK,
          fontFamily: "'Playfair Display', Georgia, serif",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Top masthead */}
        <div
          style={{
            padding: "56px 64px 28px",
            borderBottom: `2px solid ${PLUM}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontStyle: "italic", color: PLUM }}>
            The Audacious Chronicles
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, letterSpacing: 4, color: PLUM, textTransform: "uppercase" }}>
            {issueLabel ?? "FemPower AE · Member Spotlight"}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", height: POSTER_SIZE - 200, padding: "40px 64px 0" }}>
          {/* Photo column */}
          <div style={{ width: 400, flexShrink: 0 }}>
            <div
              style={{
                width: 400,
                height: 500,
                background: PLUM,
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={memberName}
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: IVORY,
                    fontSize: 140,
                  }}
                >
                  {memberName.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 14, letterSpacing: 3, color: PLUM, textTransform: "uppercase" }}>
              Featured Member
            </div>
            <div style={{ marginTop: 12, fontSize: 38, fontWeight: 700, color: INK, lineHeight: 1.05 }}>
              {memberName}
            </div>
            <div style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#555" }}>
              {roleCompany}
            </div>
          </div>

          {/* Text column */}
          <div style={{ flex: 1, paddingLeft: 56, display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontWeight: 600 }}>
              She stopped waiting for {stoppedWaitingFor}
            </div>

            <div
              style={{
                marginTop: 24,
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.08,
                color: PLUM,
                letterSpacing: -0.5,
              }}
            >
              {headline}
            </div>

            <div style={{ marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 20, color: "#333", fontStyle: "italic", lineHeight: 1.4 }}>
              {identityTag}
            </div>

            <div
              style={{
                marginTop: 36,
                paddingLeft: 24,
                borderLeft: `4px solid ${GOLD}`,
                fontSize: 30,
                fontStyle: "italic",
                lineHeight: 1.35,
                color: INK,
              }}
            >
              "{pullQuote}"
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ marginTop: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: PLUM, fontWeight: 500, lineHeight: 1.4 }}>
              {rallyLine}
            </div>
          </div>
        </div>

        {/* Footer band */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 64px",
            background: PLUM,
            color: IVORY,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            letterSpacing: 2,
          }}
        >
          <span style={{ textTransform: "uppercase" }}>Rooted Together, Rising Together</span>
          <span style={{ color: GOLD, fontWeight: 600 }}>fempowerae.com</span>
        </div>
      </div>
    );
  },
);

LinkedInPoster.displayName = "LinkedInPoster";
