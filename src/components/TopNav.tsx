import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTour } from "@/contexts/TourContext";
import { HelpCircle, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { name: "Stories", path: "/" },
  { name: "Prompt Pond", path: "/prompt-pond" },
  { name: "Tools for Crafting", path: "/tools" },
];

export const TopNav = () => {
  const location = useLocation();
  const { startTour } = useTour();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const mobileNavItems = isMobile 
    ? [...navItems, { name: "Sidekick", path: "/sidekick" }]
    : navItems;

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16">
          <h1 className="text-base sm:text-lg font-bold font-fraunces">Relational Tech Studio</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors border-b-2 pb-1 whitespace-nowrap",
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

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
              title="Start Tour"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  {mobileNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-base font-medium transition-colors py-2 px-3 rounded-lg",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary border-l-4 border-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
