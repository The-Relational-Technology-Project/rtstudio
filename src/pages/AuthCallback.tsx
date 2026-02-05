import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Auth callback page - handles redirect after magic link click.
 * Routes new users to Profile, returning users to Sidekick.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    let isMounted = true;

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
      const timeout = new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      );
      return Promise.race([Promise.resolve(promise) as Promise<T>, timeout]);
    };

    const notifyNewSignup = async (email: string, name?: string) => {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/notify-signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        });
      } catch (e) {
        console.error("Failed to send signup notification:", e);
      }
    };

    const routeUser = async (userId: string) => {
      if (!isMounted) return;
      setStatus("Setting up your space...");

      // Check if user has added anything to their profile (fast, and never block sign-in indefinitely)
      try {
        type ProfileCheck = {
          display_name: string | null;
          neighborhood: string | null;
          neighborhood_description: string | null;
          dreams: string | null;
        };

        const query = supabase
          .from("profiles")
          .select("display_name, neighborhood, neighborhood_description, dreams")
          .eq("id", userId)
          .maybeSingle();

        const result = (await withTimeout(
          query as unknown as PromiseLike<{ data: ProfileCheck | null; error: any }>,
          6000,
          "Profile lookup"
        )) as { data: ProfileCheck | null; error: any };

        if (result.error) {
          console.error("Profile check error:", result.error);
          navigate("/sidekick", { replace: true });
          return;
        }

        const profile = result.data;
        const hasProfileContent = !!profile &&
          (Boolean(profile.display_name) ||
            Boolean(profile.neighborhood) ||
            Boolean(profile.neighborhood_description) ||
            Boolean(profile.dreams));

        // If this is a new user (no profile content), send signup notification
        if (!hasProfileContent) {
          // Get the user's email from the session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            notifyNewSignup(session.user.email, profile?.display_name || undefined);
          }
        }

        navigate(hasProfileContent ? "/sidekick" : "/profile", { replace: true });
      } catch (e) {
        console.error("Profile lookup failed:", e);
        // If anything goes wrong, do not trap the user on a spinner.
        navigate("/sidekick", { replace: true });
      }
    };

    const handleAuthCallback = async () => {
      try {
        // If tokens are present in the URL hash, set the session explicitly.
        // This avoids relying on implicit, timing-sensitive parsing.
        const hash = window.location.hash?.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          const expires_in = hashParams.get("expires_in");
          const token_type = hashParams.get("token_type");

          if (access_token && refresh_token) {
            setStatus("Confirming your link...");
            await withTimeout(
              supabase.auth.setSession({
                access_token,
                refresh_token,
              }),
              8000,
              "Set session"
            );

            // Clean up the hash ASAP (don’t leave tokens in the URL)
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
          } else if (hashParams.get("error")) {
            console.error("Auth callback error in hash:", {
              error: hashParams.get("error"),
              error_description: hashParams.get("error_description"),
              token_type,
              expires_in,
            });
          }
        }

        // In implicit magic-link flow, tokens arrive in the URL hash.
        // supabase-js parses them asynchronously; poll briefly so we don't hang forever.
        const start = Date.now();
        let session = (await supabase.auth.getSession()).data.session;
        let tries = 0;

        while (!session && Date.now() - start < 8000) {
          tries += 1;
          await wait(350);
          session = (await supabase.auth.getSession()).data.session;
          if (tries === 6 && isMounted) setStatus("Almost there...");
        }
        
        if (session?.user) {
          await routeUser(session.user.id);
          return;
        }

        // Fallback: listen briefly for SIGNED_IN
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === "SIGNED_IN" && newSession?.user) {
            subscription.unsubscribe();
            await routeUser(newSession.user.id);
          }
        });

        // Hard timeout: never keep the user stuck here
        setTimeout(() => {
          try {
            subscription.unsubscribe();
          } catch {
            // ignore
          }
          if (isMounted) navigate("/auth", { replace: true });
        }, 12000);
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth", { replace: true });
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
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
