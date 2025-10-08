import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Story Board", path: "/" },
  { name: "Prompt Pond", path: "/prompt-pond" },
  { name: "Tools for Crafting", path: "/tools" },
];

export const TopNav = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <h1 className="text-base sm:text-lg font-bold font-fraunces">Studio</h1>
          
          <div className="flex gap-4 sm:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "text-xs sm:text-sm font-medium transition-colors border-b-2 pb-1 whitespace-nowrap",
                  location.pathname === item.path
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
