import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTour } from "@/contexts/TourContext";
import { HelpCircle } from "lucide-react";

const navItems = [
  { name: "Stories", path: "/" },
  { name: "Prompt Pond", path: "/prompt-pond" },
  { name: "Tools for Crafting", path: "/tools" },
];

export const TopNav = () => {
  const location = useLocation();
  const { startTour } = useTour();

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <h1 className="text-base sm:text-lg font-bold font-fraunces">Studio</h1>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex gap-4 sm:gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-colors border-b-2 pb-1 whitespace-nowrap",
                    location.pathname === item.path
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              title="Start Tour"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
