import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Commitment {
  id: string;
  user_id: string;
  commitment_text: string;
  source_chat_context: string | null;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export const CommitmentsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCommitments();
    }
  }, [user]);

  const fetchCommitments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("commitments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching commitments:", error);
      toast({
        title: "Error loading commitments",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCommitments(data || []);
    }
    setIsLoading(false);
  };

  const handleComplete = async (commitment: Commitment) => {
    if (!user) return;
    
    const newStatus = commitment.status === "completed" ? "active" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from("commitments")
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq("id", commitment.id);

      if (error) throw error;

      // Award serviceberries for completing (not for un-completing)
      if (newStatus === "completed") {
        await supabase.rpc("award_serviceberries", {
          p_user_id: user.id,
          p_amount: 10,
          p_reason: "commitment_completed",
          p_reference_id: commitment.id
        });

        toast({
          title: "🎉 Commitment completed!",
          description: "You earned 10 serviceberries for following through.",
        });
      }

      setCommitments(commitments.map(c => 
        c.id === commitment.id 
          ? { ...c, status: newStatus, completed_at: completedAt }
          : c
      ));
    } catch (error: any) {
      console.error("Error updating commitment:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commitment: Commitment) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("commitments")
        .delete()
        .eq("id", commitment.id);

      if (error) throw error;

      setCommitments(commitments.filter(c => c.id !== commitment.id));
      
      toast({
        title: "Commitment removed",
        description: "The commitment has been deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting commitment:", error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeCommitments = commitments.filter(c => c.status === "active");
  const completedCommitments = commitments.filter(c => c.status === "completed");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Commitments</h2>

      {commitments.length === 0 ? (
        <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            No commitments yet
          </p>
          <p className="text-sm text-muted-foreground">
            When you make commitments during chat sessions with Sidekick, they'll appear here for you to track.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Commitments */}
          {activeCommitments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Active ({activeCommitments.length})
              </h3>
              {activeCommitments.map((commitment) => (
                <Card key={commitment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(commitment)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{commitment.commitment_text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {commitment.created_at && 
                            formatDistanceToNow(new Date(commitment.created_at), { addSuffix: true })
                          }
                        </span>
                        {commitment.source_chat_context && (
                          <button
                            onClick={() => setExpandedId(
                              expandedId === commitment.id ? null : commitment.id
                            )}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            Context
                            {expandedId === commitment.id ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                      {expandedId === commitment.id && commitment.source_chat_context && (
                        <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                          {commitment.source_chat_context}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(commitment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Completed Commitments */}
          {completedCommitments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed ({completedCommitments.length})
              </h3>
              {completedCommitments.map((commitment) => (
                <Card key={commitment.id} className="p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(commitment)}
                      className="mt-0.5 text-primary"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground line-through">
                        {commitment.commitment_text}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Completed {commitment.completed_at && 
                          formatDistanceToNow(new Date(commitment.completed_at), { addSuffix: true })
                        }
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(commitment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
