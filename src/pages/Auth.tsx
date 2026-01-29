import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, CheckCircle } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get the intended destination from location state
  const from = (location.state as { from?: Location })?.from?.pathname || "/sidekick";

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use Supabase's native magic link - single email for both sign-up and sign-in
      // Redirect to /auth/callback which will check profile status and route accordingly
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true, // Automatically creates account if doesn't exist
        },
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
      toast({
        title: "Check your email!",
        description: "We sent you a link to access the Studio.",
      });
    } catch (error: any) {
      console.error("Magic link error:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Failed to send link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-fraunces mb-2">Check your email!</h1>
          <p className="text-muted-foreground mb-6">
            We sent a link to <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Click the link in your email to enter the Studio. New here? The link will create your account automatically.
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setMagicLinkSent(false);
              setEmail("");
            }}
            className="text-muted-foreground"
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black font-fraunces mb-2">Relational Tech Studio</h1>
          <p className="text-muted-foreground">
            Enter your email to access the Studio
          </p>
        </div>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10 border-border"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Continue with Email"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          We'll send you a link — no password needed. Works for new and returning builders.
        </p>
      </div>
    </div>
  );
};

export default Auth;
