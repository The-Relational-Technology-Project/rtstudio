import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(200),
  email: z.string().trim().email("Please enter a valid email").max(320),
  place: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Please add a message").max(5000),
});

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", place: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [k]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Honeypot — silently "succeed"
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

      // Fire-and-await email; if it fails, we still consider submission successful
      // since the row is saved.
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
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black font-fraunces text-foreground mb-3">
            Have a question or an idea?
          </h1>
          <p className="text-muted-foreground">
            Tell us what's on your mind. A real person reads these.
          </p>
        </div>

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
            {/* Honeypot */}
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
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
