import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PrototypeEmbed = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchPrototype = async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/prototypes?share_id=eq.${shareId}&select=generated_code`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const items = await response.json();
      if (items?.[0]?.generated_code) {
        setCode(items[0].generated_code);
      }
    };

    fetchPrototype();
  }, [shareId]);

  if (!code) {
    return null;
  }

  return (
    <iframe
      srcDoc={code}
      sandbox="allow-scripts"
      className="w-full border-0"
      style={{ width: "100%", height: "100vh" }}
      title="Prototype"
    />
  );
};

export default PrototypeEmbed;
