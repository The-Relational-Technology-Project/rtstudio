import { TopNav } from "@/components/TopNav";
import { Sidekick } from "@/components/Sidekick";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SidekickPage = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const sessionToken = localStorage.getItem("studio_session");
      if (!sessionToken) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-session', {
          body: { token: sessionToken }
        });

        if (error || !data?.valid) {
          localStorage.removeItem("studio_session");
          navigate("/auth");
          return;
        }

        setIsVerified(true);
      } catch (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem("studio_session");
        navigate("/auth");
      }
    };

    verifyAccess();
  }, [navigate]);

  if (!isVerified) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <Sidekick fullPage />
        </div>
      </main>
    </div>
  );
};

export default SidekickPage;
