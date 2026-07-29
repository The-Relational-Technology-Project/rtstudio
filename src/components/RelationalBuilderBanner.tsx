import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "rb-banner-dismissed-v1";

export const RelationalBuilderBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative bg-primary text-primary-foreground">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <a
          href="https://relationalbuilder.org"
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 py-2.5 pr-8 group"
        >
          <div className="flex-1 min-w-0">
            <p className="font-serif font-semibold text-sm sm:text-base leading-snug">
              Relational Builder is ready to test!
            </p>
            <p className="text-xs sm:text-sm opacity-90 leading-snug">
              A free, open-source builder for local relational technologists — with an easy way to
              bring your Studio profile and projects with you.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap border-b border-primary-foreground/40 group-hover:border-primary-foreground transition-colors">
            Try it
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setDismissed(true);
        }}
        className="absolute right-2 top-2 p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
