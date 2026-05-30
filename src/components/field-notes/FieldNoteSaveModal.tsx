import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ReminderChoice =
  | { kind: "none" }
  | { kind: "studio"; days: number }
  | { kind: "email"; days: number; email: string }
  | { kind: "sms"; days: number; phone: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (choices: { share: boolean; reminder: ReminderChoice }) => void;
  defaultEmail?: string;
  submitting?: boolean;
}

type Step = "share" | "reminder" | "channel" | "timing";

export const FieldNoteSaveModal = ({ open, onClose, onSubmit, defaultEmail, submitting }: Props) => {
  const [step, setStep] = useState<Step>("share");
  const [share, setShare] = useState(false);
  const [days, setDays] = useState(7);
  const [channel, setChannel] = useState<"email" | "sms" | "studio" | null>(null);
  const [email, setEmail] = useState(defaultEmail || "");
  const [phone, setPhone] = useState("");

  const reset = () => {
    setStep("share");
    setShare(false);
    setDays(7);
    setChannel(null);
    setEmail(defaultEmail || "");
    setPhone("");
  };

  const finish = (reminder: ReminderChoice) => {
    onSubmit({ share, reminder });
    reset();
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        {step === "share" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-fraunces text-2xl">Saved.</DialogTitle>
              <DialogDescription className="pt-2">
                Would you like to share this Field Note publicly with others on Relational Tech Studio?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShare(false);
                  setStep("reminder");
                }}
              >
                No
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShare(true);
                  setStep("reminder");
                }}
              >
                Yes
              </Button>
            </div>
          </>
        )}

        {step === "reminder" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-fraunces text-2xl">A reminder?</DialogTitle>
              <DialogDescription className="pt-2">
                Would you like a reminder to write another Field Note?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={() => {
                  setDays(7);
                  setStep("channel");
                }}
                disabled={submitting}
              >
                Yes, in a week
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep("timing")}
                disabled={submitting}
              >
                Yes, but let me choose the timing
              </Button>
              <Button
                variant="ghost"
                onClick={() => finish({ kind: "none" })}
                disabled={submitting}
              >
                No thanks
              </Button>
            </div>
          </>
        )}

        {step === "timing" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-fraunces text-2xl">When?</DialogTitle>
              <DialogDescription className="pt-2">Remind me in…</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-4">
              {[3, 7, 14, 30].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "outline"}
                  onClick={() => setDays(d)}
                >
                  {d} days
                </Button>
              ))}
              <Button className="mt-2" onClick={() => setStep("channel")} disabled={submitting}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "channel" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-fraunces text-2xl">How should we reach you?</DialogTitle>
              <DialogDescription className="pt-2">
                We'll remind you in {days} {days === 1 ? "day" : "days"}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex gap-2">
                <Button
                  variant={channel === "studio" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setChannel("studio")}
                >
                  Here on Studio
                </Button>
                <Button
                  variant={channel === "email" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setChannel("email")}
                >
                  Email
                </Button>
                <Button
                  variant={channel === "sms" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setChannel("sms")}
                >
                  Text
                </Button>
              </div>

              {channel === "email" && (
                <div>
                  <Label htmlFor="reminder-email">Email address</Label>
                  <Input
                    id="reminder-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              )}
              {channel === "sms" && (
                <div>
                  <Label htmlFor="reminder-phone">Phone number</Label>
                  <Input
                    id="reminder-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 555 5555"
                  />
                </div>
              )}

              <Button
                className="mt-2"
                disabled={
                  !channel ||
                  (channel === "email" && !email.trim()) ||
                  (channel === "sms" && !phone.trim()) ||
                  submitting
                }
                onClick={() => {
                  if (channel === "studio") finish({ kind: "studio", days });
                  else if (channel === "email") finish({ kind: "email", days, email: email.trim() });
                  else if (channel === "sms") finish({ kind: "sms", days, phone: phone.trim() });
                }}
              >
                {submitting ? "Saving…" : "Set reminder"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
