import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call edge function to verify password against database
      const { data, error } = await supabase.functions.invoke('verify-password', {
        body: { password }
      });

      if (error) {
        console.error('Verification error:', error);
        toast({
          title: "Error",
          description: "Authentication service unavailable. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.valid && data?.token) {
        localStorage.setItem("studio_session", data.token);
        toast({
          title: "Welcome to the Studio",
          description: "Access granted",
        });
        navigate("/");
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Relational Tech Studio</h1>
          <p className="text-muted-foreground">Enter password to access</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter studio password"
              className="border-border"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            disabled={isLoading}
          >
            {isLoading ? "Accessing..." : "Enter Studio"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
