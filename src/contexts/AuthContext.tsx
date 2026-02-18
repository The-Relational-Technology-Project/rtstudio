import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  neighborhood: string | null;
  neighborhood_description: string | null;
  dreams: string | null;
  tech_familiarity: string | null;
  ai_coding_experience: string | null;
  local_tech_ecosystem: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile | null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
        const timeout = new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        );
        return Promise.race([Promise.resolve(promise) as Promise<T>, timeout]);
      };

      // Check if there's a hash fragment with auth tokens (magic link callback)
      const hasAuthCallback = window.location.hash.includes('access_token') || 
                              window.location.hash.includes('refresh_token') ||
                              window.location.hash.includes('error');

      if (hasAuthCallback) {
        console.log("Auth callback detected, processing...");
        // Supabase will automatically parse the hash and set up the session
        // We need to wait for this to complete
      }

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        console.log("Auth state changed:", event, currentSession?.user?.email);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // IMPORTANT: Never block the UI on profile fetch (RLS/network hiccups can cause infinite spinners)
        setLoading(false);

        if (currentSession?.user) {
          fetchProfile(currentSession.user.id)
            .then((profileData) => {
              if (mounted) setProfile(profileData);
            })
            .catch((err) => console.error("Error fetching profile (background):", err));
        } else {
          setProfile(null);
        }

        // Clean up URL hash after successful auth
        if (event === "SIGNED_IN" && window.location.hash) {
          // Remove the hash without triggering a navigation
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      });

      // Get initial session (never allow this to hang the UI)
      let initialSession: Session | null = null;
      try {
        const result = await withTimeout(
          supabase.auth.getSession(),
          5000,
          "Get session"
        );
        initialSession = result.data.session ?? null;
        if (result.error) {
          console.error("Error getting session:", result.error);
        }
      } catch (e) {
        console.error("Get session failed/timed out:", e);
      }
      
      if (!mounted) return;

      // If there's an auth callback, the onAuthStateChange will handle it.
      // Otherwise, hydrate from storage and avoid blocking on profile.
      if (!hasAuthCallback) {
        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);
        setLoading(false);

        if (initialSession?.user) {
          fetchProfile(initialSession.user.id)
            .then((profileData) => {
              if (mounted) setProfile(profileData);
            })
            .catch((err) => console.error("Error fetching profile (background):", err));
        } else {
          setProfile(null);
        }
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
