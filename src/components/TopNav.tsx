import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTour } from "@/contexts/TourContext";
import { useAuth } from "@/contexts/AuthContext";
import { ServiceberriesCounter } from "@/components/ServiceberriesCounter";
import { HelpCircle, Menu, X, User, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { name: "Sidekick", path: "/sidekick" },
  { name: "Library", path: "/library" },
];

export const TopNav = () => {
  const location = useLocation();
  const { startTour } = useTour();
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const mobileNavItems = [
    ...navItems,
    { name: "Profile", path: "/profile" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="text-base sm:text-lg font-bold font-fraunces hover:text-primary transition-colors">
            Relational Tech Studio
          </Link>
          
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
            
            <ServiceberriesCounter variant="nav" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              title="Start Tour"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{profile?.display_name || "Builder"}</p>
                  {profile?.neighborhood && (
                    <p className="text-xs text-muted-foreground">{profile.neighborhood}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {/* Profile section at top */}
                <div className="border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{profile?.display_name || "Builder"}</p>
                      {profile?.neighborhood && (
                        <p className="text-xs text-muted-foreground">{profile.neighborhood}</p>
                      )}
                    </div>
                  </div>
                </div>

                <nav className="flex flex-col gap-4">
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

                <div className="absolute bottom-8 left-6 right-6">
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};