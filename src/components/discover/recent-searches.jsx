import { History } from "lucide-react";

const MAX_VISIBLE = 3;

// One-click recall of filter combinations the person has actually searched
// before on this browser (see hooks/use-recent-searches.jsx) — not a
// suggestion engine, just their own history. Capped at 3 items and kept to
// a single row (horizontal scroll instead of wrap) on every breakpoint —
// on mobile that means extra chips sit off to the right, swipeable, rather
// than wrapping to a second line and getting truncated.
const RecentSearches = ({ items, onApply }) => {
  const visible = items?.slice(0, MAX_VISIBLE);
  if (!visible?.length) return null;

  return (
    <div className="mb-4">
      <span className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5" /> Recent searches
      </span>
      <div className="flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((item) => (
          <button
            key={item.label}
            type="button"
            title={item.label}
            onClick={() => onApply(item.filters)}
            className="hairline shrink-0 whitespace-nowrap rounded-full bg-background/40 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;