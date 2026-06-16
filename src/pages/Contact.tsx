import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Gift, CheckCircle, Calendar, Sparkles } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(200),
  email: z.string().trim().email("Please enter a valid email").max(320),
  place: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Please add a message").max(5000),
});

const Contact = () => {
  const { toast } = useToast();

  // Gift Build form
  const [giftForm, setGiftForm] = useState({
    name: "",
    email: "",
    neighborhood: "",
    idea: "",
  });
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [giftSubmitted, setGiftSubmitted] = useState(false);

  // Contact form
  const [form, setForm] = useState({ name: "", email: "", place: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [k]: e.target.value });
  };

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftForm.name.trim() || !giftForm.idea.trim()) {
      toast({ title: "Please fill in your name and idea description.", variant: "destructive" });
      return;
    }
    setGiftSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("notify-gift-build", {
        body: {
          builder_name: giftForm.name.trim(),
          builder_email: giftForm.email.trim() || undefined,
          neighborhood: giftForm.neighborhood.trim() || undefined,
          idea_title: giftForm.idea.trim().slice(0, 100),
          idea_summary: giftForm.idea.trim(),
          source: "support_page",
        },
      });
      if (error) throw error;
      setGiftSubmitted(true);
    } catch (err) {
      console.error("Gift build submit error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or reach out directly.",
        variant: "destructive",
      });
    } finally {
      setGiftSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (form.website.trim().length > 0) {
      setSent(true);
      return;
    }

    const parsed = schema.safeParse({
      name: form.name,
      email: form.email,
      place: form.place || undefined,
      message: form.message,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const { error: insertError } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        place: parsed.data.place ?? null,
        message: parsed.data.message,
      });
      if (insertError) throw insertError;

      try {
        await supabase.functions.invoke("notify-contact", {
          body: {
            name: parsed.data.name,
            email: parsed.data.email,
            place: parsed.data.place ?? "",
            message: parsed.data.message,
            website: form.website,
          },
        });
      } catch (emailErr) {
        console.error("notify-contact failed:", emailErr);
      }

      setSent(true);
    } catch (err: any) {
      console.error("Contact submit failed:", err);
      setSubmitError("Something went wrong on our end. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 md:py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black font-fraunces text-foreground mb-3">
            Gift Build Request and Contact
          </h1>
          <p className="text-muted-foreground">
            Ask Josh to build with you, or just say hello. A real person reads everything here.
          </p>
        </div>

        {/* Gift Build Request */}
        <section className="mb-12 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold font-fraunces">Request a Gift Build</h2>
          </div>

          {giftSubmitted ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-2">
                    Your Gift Build request has been sent!
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Josh will review your idea and prepare for your session. Book a time at least
                    a week out so he can come ready to build with you.
                  </p>
                </div>
              </div>
              <Button asChild>
                <a href="https://cal.com/joshnesbit/" target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Your Jam Session
                </a>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground mb-2">
                Have an idea for a neighborhood tool? Josh from the RTP team will walk you through
                an initial build and help you get set up with the right tools — completely free.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                We recommend booking your session at least a week out so Josh can review your idea
                beforehand.
              </p>
              <div className="flex items-center gap-2 mb-5 p-3 rounded-md bg-background border border-border">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Not sure where to start?{" "}
                  <Link to="/home" className="text-primary hover:underline font-medium">
                    Chat with Sidekick
                  </Link>{" "}
                  to develop your idea first.
                </p>
              </div>

              <form onSubmit={handleGiftSubmit} className="space-y-4">
                <div>
                  <label htmlFor="gift-name" className="text-sm font-medium mb-1 block">
                    Your name *
                  </label>
                  <Input
                    id="gift-name"
                    value={giftForm.name}
                    onChange={(e) => setGiftForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    maxLength={200}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="gift-email" className="text-sm font-medium mb-1 block">
                    Email
                  </label>
                  <Input
                    id="gift-email"
                    type="email"
                    value={giftForm.email}
                    onChange={(e) => setGiftForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="So Josh can follow up"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label htmlFor="gift-neighborhood" className="text-sm font-medium mb-1 block">
                    Neighborhood
                  </label>
                  <Input
                    id="gift-neighborhood"
                    value={giftForm.neighborhood}
                    onChange={(e) => setGiftForm((f) => ({ ...f, neighborhood: e.target.value }))}
                    placeholder="Where are you building?"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="gift-idea" className="text-sm font-medium mb-1 block">
                    Describe your idea *
                  </label>
                  <Textarea
                    id="gift-idea"
                    value={giftForm.idea}
                    onChange={(e) => setGiftForm((f) => ({ ...f, idea: e.target.value }))}
                    placeholder="What do you want to build for your neighborhood? Who is it for? What problem does it solve?"
                    className="min-h-[120px]"
                    maxLength={5000}
                    required
                  />
                </div>
                <Button type="submit" disabled={giftSubmitting}>
                  <Gift className="mr-2 h-4 w-4" />
                  {giftSubmitting ? "Sending..." : "Submit Gift Build Request"}
                </Button>
              </form>
            </>
          )}
        </section>

        {/* General contact */}
        <section>
          <h2 className="text-xl font-semibold font-fraunces mb-2">
            Have a question or an idea?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tell us what's on your mind. We reply from{" "}
            <span className="text-foreground">humans@relationaltechproject.org</span>.
          </p>

          {sent ? (
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
              <p className="font-fraunces text-xl text-foreground mb-2">Thanks. We'll be in touch.</p>
              <p className="text-sm text-muted-foreground">
                We read every message and reply from <span className="text-foreground">humans@relationaltechproject.org</span>.
              </p>
              <Link to="/" className="inline-block mt-6">
                <Button variant="outline">Back home</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-5" noValidate>
              <div className="hidden" aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={update("website")}
                  />
                </label>
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={update("name")}
                  required
                  maxLength={200}
                  className="mt-1.5"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  required
                  maxLength={320}
                  className="mt-1.5"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="place">Your neighborhood or place <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="place"
                  value={form.place}
                  onChange={update("place")}
                  maxLength={200}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={update("message")}
                  required
                  maxLength={5000}
                  rows={6}
                  className="mt-1.5"
                  aria-invalid={!!errors.message}
                />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? "Sending…" : "Send"}
              </Button>
            </form>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
