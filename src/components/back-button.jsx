import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Shared back navigation for every employer page except Dashboard.
 *
 * Behavior:
 * - If the link/navigate() call that brought the user here passed
 *   `state={{ from: { path, label } }}`, that's the source of truth for
 *   both the label and the destination — it reflects wherever the user
 *   *actually* came from (Manage Jobs, a specific job's Applicants page,
 *   the Dashboard, etc), instead of a hardcoded guess baked into the
 *   current page.
 * - Otherwise it falls back to the `fallbackTo`/`label` props.
 * - Either way, the click always navigates to that exact path (never
 *   `navigate(-1)`). Browser history isn't reliable here — e.g. reaching
 *   this page via the sidebar after visiting an unrelated page first
 *   would make `navigate(-1)` jump to that unrelated page, not wherever
 *   the label says. Navigating to a known path keeps what the button
 *   says and where it goes always in sync.
 */
const BackButton = ({ fallbackTo = "/employer/dashboard", label = "Back" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Where the caller says we actually came from, if it told us.
  const from = location.state?.from;
  const resolvedLabel = from?.label ? `Back to ${from.label}` : label;
  const resolvedFallback = from?.path || fallbackTo;

  const handleClick = () => {
    navigate(resolvedFallback);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {resolvedLabel}
    </button>
  );
};

export default BackButton;