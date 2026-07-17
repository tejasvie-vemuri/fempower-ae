interface SpotlightStoryProps {
  story: string;
  headline?: string | null;
  the_before?: string | null;
  the_turning_point?: string | null;
  the_now?: string | null;
  advice?: string | null;
  shoutout?: string | null;
}

// Renders the guided-story shape (headline -> before -> turning point -> now -> advice)
// when present, falling back to the plain free-text `story` for legacy entries.
// Used identically by the public SpotlightCard and the admin review preview so
// there's one source of truth for what "beautiful" looks like.
const SpotlightStory = ({
  story,
  headline,
  the_before,
  the_turning_point,
  the_now,
  advice,
  shoutout,
}: SpotlightStoryProps) => {
  if (!headline) {
    return (
      <p className="font-body text-foreground/85 leading-relaxed whitespace-pre-wrap">
        {story}
      </p>
    );
  }

  return (
    <div>
      <p className="font-heading text-lg md:text-xl font-medium text-blush-dark leading-snug mb-3">
        "{headline}"
      </p>
      <div className="space-y-3 font-body text-foreground/85 leading-relaxed">
        {the_before && <p>{the_before}</p>}
        {the_turning_point && <p>{the_turning_point}</p>}
        {the_now && <p>{the_now}</p>}
      </div>
      {advice && (
        <div className="mt-4 bg-blush-dark/5 border-l-2 border-blush-dark/40 pl-4 py-2 rounded-r">
          <p className="text-xs uppercase tracking-wide text-blush-dark font-semibold mb-1">
            Her advice to the sisterhood
          </p>
          <p className="font-body text-sm text-foreground/85 italic">"{advice}"</p>
        </div>
      )}
      {shoutout && (
        <p className="mt-3 text-xs text-muted-foreground font-body">💛 Shoutout to {shoutout}</p>
      )}
    </div>
  );
};

export default SpotlightStory;
