import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border mt-auto">
      <p className="flex items-center justify-center gap-2 flex-wrap">
        <span>Made with care for neighbors everywhere</span>
        <span className="hidden sm:inline">·</span>
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy & Terms
        </Link>
      </p>
    </footer>
  );
};
