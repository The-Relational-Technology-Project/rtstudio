import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, MapPin, User, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Step = "welcome" | "about" | "dreams" | "tech";

export const ProfileOnboarding = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [neighborhoodDescription, setNeighborhoodDescription] = useState("");
  const [dreams, setDreams] = useState("");
  const [techFamiliarity, setTechFamiliarity] = useState<string>("");
  const [aiCodingExperience, setAiCodingExperience] = useState<string>("");

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          neighborhood: neighborhood || null,
          neighborhood_description: neighborhoodDescription || null,
          dreams: dreams || null,
          tech_familiarity: techFamiliarity || null,
          ai_coding_experience: aiCodingExperience || null,
          profile_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Award serviceberries for profile setup
      await supabase.rpc("award_serviceberries", {
        p_user_id: user.id,
        p_amount: 10,
        p_reason: "profile_setup",
      });

      await refreshProfile();

      toast({
        title: "Profile complete! 🎉",
        description: "You earned 10 serviceberries for setting up your profile.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error completing profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Step[] = ["welcome", "about", "dreams", "tech"];
  const currentIndex = steps.indexOf(step);

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8 justify-center">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                i <= currentIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-fraunces mb-4">
              Welcome to the Studio!
            </h1>
            <p className="text-muted-foreground mb-8">
              Let's set up your builder profile. This helps us personalize your
              experience and connect you with the right resources.
            </p>
            <Button onClick={goNext} className="w-full">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step: About You */}
        {step === "about" && (
          <div>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <User className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-6">About You</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">What should we call you?</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or nickname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Your neighborhood or place
                </Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g., East Austin, Brooklyn Heights"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhoodDescription">
                  Tell us a bit about it (optional)
                </Label>
                <Textarea
                  id="neighborhoodDescription"
                  value={neighborhoodDescription}
                  onChange={(e) => setNeighborhoodDescription(e.target.value)}
                  placeholder="What makes your neighborhood special?"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={goNext} className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Dreams */}
        {step === "dreams" && (
          <div>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Your Dreams</h2>
            <p className="text-muted-foreground text-center mb-6">
              What are you hoping to build or create for your community?
            </p>
            <Textarea
              value={dreams}
              onChange={(e) => setDreams(e.target.value)}
              placeholder="A tool for neighbors to share meals, a website for our community garden, a way to organize block parties..."
              rows={5}
              className="mb-8"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={goNext} className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Tech Comfort */}
        {step === "tech" && (
          <div>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-6">
              Tech Comfort Level
            </h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>How familiar are you with technology?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "new", label: "New to tech" },
                    { value: "learning", label: "Learning" },
                    { value: "comfortable", label: "Comfortable" },
                    { value: "experienced", label: "Experienced" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={techFamiliarity === option.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setTechFamiliarity(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Experience with AI coding tools?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "never", label: "Never tried" },
                    { value: "a_little", label: "A little" },
                    { value: "regular", label: "Regular use" },
                    { value: "daily", label: "Daily" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={aiCodingExperience === option.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setAiCodingExperience(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
