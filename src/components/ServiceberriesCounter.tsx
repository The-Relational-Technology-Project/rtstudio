import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Cherry, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Serviceberry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  reference_id: string | null;
  created_at: string | null;
}

const REASON_LABELS: Record<string, string> = {
  profile_setup: "Profile setup completed",
  first_chat: "First chat with Sidekick",
  commitment_made: "Made a commitment",
  commitment_completed: "Completed a commitment",
  library_contribution: "Contributed to the library",
};

interface ServiceberriesCounterProps {
  variant?: "nav" | "profile";
}

export const ServiceberriesCounter = ({ variant = "nav" }: ServiceberriesCounterProps) => {
  const { user } = useAuth();
  
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState<Serviceberry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchServiceberries();
    }
  }, [user]);

  const fetchServiceberries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("serviceberries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching serviceberries:", error);
    } else {
      const berries = data || [];
      setHistory(berries);
      setTotal(berries.reduce((sum, b) => sum + b.amount, 0));
    }
    setIsLoading(false);
  };

  // Refetch when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      fetchServiceberries();
    }
  }, [isOpen, user]);

  if (variant === "nav") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Cherry className="h-4 w-4 text-rose-500" />
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="font-medium">{total}</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cherry className="h-5 w-5 text-rose-500" />
              Your Serviceberries
            </DialogTitle>
          </DialogHeader>
          <ServiceberriesContent 
            total={total} 
            history={history} 
            isLoading={isLoading} 
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Profile variant - inline display
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Cherry className="h-5 w-5 text-rose-500" />
          Serviceberries
        </h2>
        <div className="text-2xl font-bold text-rose-500">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : total}
        </div>
      </div>
      <ServiceberriesContent 
        total={total} 
        history={history} 
        isLoading={isLoading}
        showTotal={false}
      />
    </div>
  );
};

interface ServiceberriesContentProps {
  total: number;
  history: Serviceberry[];
  isLoading: boolean;
  showTotal?: boolean;
}

const ServiceberriesContent = ({ 
  total, 
  history, 
  isLoading,
  showTotal = true 
}: ServiceberriesContentProps) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {showTotal && (
        <div className="text-center p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg">
          <div className="text-4xl font-bold text-rose-500">{total}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Total serviceberries earned
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Recent Activity
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Complete your profile to earn your first serviceberries!
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.slice(0, 10).map((berry) => (
              <div
                key={berry.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded"
              >
                <div>
                  <p className="text-sm">
                    {REASON_LABELS[berry.reason] || berry.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {berry.created_at &&
                      formatDistanceToNow(new Date(berry.created_at), {
                        addSuffix: true,
                      })}
                  </p>
                </div>
                <span className="font-medium text-rose-500">+{berry.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Serviceberries celebrate your contributions to the commons and your commitment to your neighborhood.
        </p>
      </div>
    </div>
  );
};
