import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-primary-foreground">
        <Compass className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-5xl">404</h1>
      <p className="mt-2 text-lg font-medium">This page doesn't exist.</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        The link may be broken, or the page may have moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
};

export default NotFoundPage;