import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Auth callback page - handles redirect after magic link click.
 * Routes new users to Profile, returning users to Sidekick.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for auth state to be processed from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          navigate("/auth", { replace: true });
          return;
        }

        if (!session?.user) {
          // No session yet, wait for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession?.user) {
                subscription.unsubscribe();
                await routeUser(newSession.user.id);
              }
            }
          );
          
          // Set a timeout in case auth doesn't complete
          setTimeout(() => {
            subscription.unsubscribe();
            navigate("/auth", { replace: true });
          }, 10000);
          return;
        }

        await routeUser(session.user.id);
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth", { replace: true });
      }
    };

    const routeUser = async (userId: string) => {
      setStatus("Setting up your space...");
      
      // Check if user has completed their profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("profile_completed, display_name")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile check error:", profileError);
        // Default to sidekick if we can't check profile
        navigate("/sidekick", { replace: true });
        return;
      }

      // New users or incomplete profiles go to Profile page
      if (!profile || !profile.profile_completed) {
        console.log("New/incomplete user, routing to profile");
        navigate("/profile", { replace: true });
      } else {
        // Returning users with complete profiles go to Sidekick
        console.log("Returning user, routing to sidekick");
        navigate("/sidekick", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
