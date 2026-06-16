import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Menu, X, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { ContributionDialog } from "@/components/ContributionDialog";

const navItems = [
  { name: "Home", path: "/home" },
  { name: "Library", path: "/library" },
  { name: "Network", path: "/network" },
  { name: "Profile", path: "/profile" },
];

export const TopNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);

  const allNavItems = isAdmin
    ? [...navItems, { name: "Admin", path: "/admin" }]
    : navItems;

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
              {allNavItems.map((item) => (
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

            {user && (
              <Button
                size="sm"
                onClick={() => setContributeOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Contribute
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Button
                size="sm"
                onClick={() => setContributeOpen(true)}
                className="gap-1.5 h-9"
              >
                <Plus className="w-4 h-4" />
                Contribute
              </Button>
            )}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-2 mt-6">
                  {allNavItems.map((item) => (
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

      {user && (
        <ContributionDialog
          open={contributeOpen}
          onOpenChange={setContributeOpen}
        />
      )}
    </nav>
  );
};
