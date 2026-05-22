import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Studio } from "./AssignStudiosDialog";

interface Props {
  itemId: string;
  itemType: "story" | "prompt" | "tool";
  current: string[]; // slugs
  studios: Studio[];
  onChange: (next: string[]) => void;
}

export const RowStudiosPopover = ({ itemId, itemType, current, studios, onChange }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (slug: string) => {
    setBusy(slug);
    const has = current.includes(slug);
    if (has) {
      const { error } = await supabase.from("library_studio_assignments")
        .delete()
        .eq("studio_slug", slug).eq("item_type", itemType).eq("item_id", itemId);
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
      } else {
        onChange(current.filter(s => s !== slug));
      }
    } else {
      const { error } = await supabase.from("library_studio_assignments")
        .insert({ studio_slug: slug, item_type: itemType, item_id: itemId });
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
      } else {
        onChange([...current, slug]);
      }
    }
    setBusy(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" title="Assign studios">
          <Tag className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Studios</div>
          {studios.map(s => (
            <label key={s.slug} className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={current.includes(s.slug)}
                disabled={busy === s.slug}
                onCheckedChange={() => toggle(s.slug)}
              />
              <span
                className="inline-block w-3 h-3 rounded-full border border-border"
                style={s.color ? { backgroundColor: s.color } : undefined}
              />
              <span>{s.label}</span>
            </label>
          ))}
          {studios.length === 0 && (
            <p className="text-xs text-muted-foreground">No studios defined.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
