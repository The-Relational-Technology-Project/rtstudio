import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PrototypeEmbed = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchPrototype = async () => {
      const { data } = await supabase
        .from("prototypes")
        .select("generated_code")
        .eq("share_id", shareId)
        .maybeSingle();

      if (data?.generated_code) {
        setCode(data.generated_code);
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
