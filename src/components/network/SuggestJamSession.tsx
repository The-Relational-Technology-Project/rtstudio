import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Music } from "lucide-react";

export const SuggestJamSession = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    neighborhood: "",
    topic: "",
    description: "",
    preferred_timing: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.topic.trim() || !form.description.trim()) {
      toast({
        title: "Please fill in your name, topic, and description.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("notify-jam-session", {
        body: {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          neighborhood: form.neighborhood.trim() || undefined,
          topic: form.topic.trim(),
          description: form.description.trim(),
          preferred_timing: form.preferred_timing.trim() || undefined,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("Jam session suggestion failed:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-fraunces font-bold text-foreground mb-2 flex items-center gap-2">
        <Music className="h-5 w-5 text-primary" />
        Suggest a Jam Session
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Have an idea for an event, a group build, or a topic worth gathering around? Tell us
        what you'd like to see and we'll help bring people together.
      </p>

      {submitted ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Thanks — your suggestion is in.
              </p>
              <p className="text-sm text-muted-foreground">
                A steward will follow up if there's a good fit or to pull together the group.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <label htmlFor="jam-name" className="text-sm font-medium mb-1 block">
              Your name *
            </label>
            <Input
              id="jam-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={200}
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jam-email" className="text-sm font-medium mb-1 block">
                Email
              </label>
              <Input
                id="jam-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="So we can follow up"
                maxLength={255}
              />
            </div>
            <div>
              <label htmlFor="jam-neighborhood" className="text-sm font-medium mb-1 block">
                Neighborhood
              </label>
              <Input
                id="jam-neighborhood"
                value={form.neighborhood}
                onChange={(e) =>
                  setForm((f) => ({ ...f, neighborhood: e.target.value }))
                }
                maxLength={200}
              />
            </div>
          </div>
          <div>
            <label htmlFor="jam-topic" className="text-sm font-medium mb-1 block">
              Topic or event title *
            </label>
            <Input
              id="jam-topic"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. Block-party tools build night"
              maxLength={200}
              required
            />
          </div>
          <div>
            <label htmlFor="jam-description" className="text-sm font-medium mb-1 block">
              What would you like to do together? *
            </label>
            <Textarea
              id="jam-description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What's the format? Who's it for? What would folks walk away with?"
              className="min-h-[120px]"
              maxLength={5000}
              required
            />
          </div>
          <div>
            <label htmlFor="jam-timing" className="text-sm font-medium mb-1 block">
              Preferred timing
            </label>
            <Input
              id="jam-timing"
              value={form.preferred_timing}
              onChange={(e) =>
                setForm((f) => ({ ...f, preferred_timing: e.target.value }))
              }
              placeholder="e.g. Weekday evenings, late June"
              maxLength={200}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            <Music className="mr-2 h-4 w-4" />
            {submitting ? "Sending…" : "Submit suggestion"}
          </Button>
        </form>
      )}
    </section>
  );
};
