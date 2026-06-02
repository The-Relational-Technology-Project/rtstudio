import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

export const FaqsTab = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast({ title: "Couldn't load FAQs", description: error.message, variant: "destructive" });
    } else {
      setFaqs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Faq>) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const save = async (faq: Faq) => {
    setSavingId(faq.id);
    const { error } = await (supabase as any)
      .from("faqs")
      .update({
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order,
        is_published: faq.is_published,
      })
      .eq("id", faq.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await (supabase as any).from("faqs").delete().eq("id", id);
    if (error) {
      toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    } else {
      setFaqs(prev => prev.filter(f => f.id !== id));
    }
  };

  const add = async () => {
    const nextOrder = (faqs.at(-1)?.sort_order ?? 0) + 10;
    const { data, error } = await (supabase as any)
      .from("faqs")
      .insert({ question: "New question", answer: "Answer", sort_order: nextOrder, is_published: false })
      .select()
      .single();
    if (error) {
      toast({ title: "Couldn't create", description: error.message, variant: "destructive" });
    } else {
      setFaqs(prev => [...prev, data]);
    }
  };

  if (loading) return <LoadingSpinner text="Loading FAQs..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Edit the FAQs shown on the public landing page. Unpublished items are hidden from visitors.
        </p>
        <Button onClick={add} size="sm"><Plus className="h-4 w-4 mr-1" />Add FAQ</Button>
      </div>

      <div className="space-y-4">
        {faqs.map(faq => (
          <div key={faq.id} className="border border-border rounded-xl p-4 bg-card space-y-3">
            <div className="flex gap-3 items-start">
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label>Question</Label>
                  <Input value={faq.question} onChange={e => update(faq.id, { question: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Answer</Label>
                  <Textarea rows={4} value={faq.answer} onChange={e => update(faq.id, { answer: e.target.value })} />
                </div>
                <div className="flex gap-3 items-end">
                  <div className="space-y-1.5 w-32">
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      value={faq.sort_order}
                      onChange={e => update(faq.id, { sort_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => update(faq.id, { is_published: !faq.is_published })}
                  >
                    {faq.is_published
                      ? <><Eye className="h-3.5 w-3.5 mr-1" />Published</>
                      : <><EyeOff className="h-3.5 w-3.5 mr-1" />Hidden</>}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => remove(faq.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
              </Button>
              <Button size="sm" onClick={() => save(faq)} disabled={savingId === faq.id}>
                <Save className="h-3.5 w-3.5 mr-1" />{savingId === faq.id ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No FAQs yet. Add one to get started.</p>
        )}
      </div>
    </div>
  );
};
