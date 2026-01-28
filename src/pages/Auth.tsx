import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get the intended destination from location state
  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  // Check for magic link token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && !isVerifying) {
      verifyMagicLink(token);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already logged in
    if (user && !isVerifying) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, isVerifying]);

  const verifyMagicLink = async (token: string) => {
    setIsVerifying(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-magic-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // The verification was successful, now sign in with OTP
      // Since the user is already confirmed, we can use signInWithOtp
      // which will send another email, OR we use the admin-created session
      
      if (data.success && data.email) {
        // Use signInWithOtp to complete the sign-in process
        // This sends another email, but the user is already verified
        // A better approach: use the Supabase admin to generate a link
        
        // For now, let's trigger a Supabase OTP that will auto-confirm
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            shouldCreateUser: true,
          },
        });

        if (otpError) {
          console.error("OTP error:", otpError);
          // If OTP fails, the user might already be signed in
          // Check if we have a session
          const { data: session } = await supabase.auth.getSession();
          if (session.session) {
            toast({
              title: "Welcome!",
              description: "You're now signed in.",
            });
            navigate(from, { replace: true });
            return;
          }
        }

        toast({
          title: data.isNewUser ? "Account created!" : "Welcome back!",
          description: "Check your email for the final sign-in link.",
        });
        
        // Clear the token from URL
        navigate("/auth", { replace: true });
        setMagicLinkSent(true);
        setEmail(data.email);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "The magic link is invalid or expired.",
        variant: "destructive",
      });
      // Clear the token from URL
      navigate("/auth", { replace: true });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-magic-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email,
            redirectUrl: `${window.location.origin}/auth`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      setMagicLinkSent(true);
      toast({
        title: "Check your email!",
        description: "We sent you a magic link to sign in.",
      });
    } catch (error: any) {
      console.error("Magic link error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Verifying your link...</h1>
          <p className="text-muted-foreground">Please wait while we sign you in.</p>
        </div>
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email!</h1>
          <p className="text-muted-foreground mb-6">
            We sent a magic link to <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Click the link in your email to sign in. The link will expire in 1 hour.
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
            Enter your email to receive a magic link
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
              "Send Magic Link"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No password needed. We'll send you a link to sign in.
        </p>
      </div>
    </div>
  );
};

export default Auth;
