import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";
import { VisionBoard } from "@/components/VisionBoard";
import { CommitmentsList } from "@/components/CommitmentsList";
import { ServiceberriesCounter } from "@/components/ServiceberriesCounter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Sparkles, Network, Pencil, Check, X } from "lucide-react";

const EditableSection = ({
  icon,
  label,
  value,
  placeholder,
  fieldKey,
  userId,
  onSaved,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  placeholder: string;
  fieldKey: string;
  userId: string;
  onSaved: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ [fieldKey]: draft })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      onSaved();
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setDraft(value || "");
    setEditing(false);
  };

  return (
    <div className="mb-8 p-6 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {label}
        </h2>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => { setDraft(value || ""); setEditing(true); }}>
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="h-3 w-3 mr-1" />
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-foreground text-sm whitespace-pre-wrap">
          {value || <span className="text-muted-foreground italic">{placeholder}</span>}
        </p>
      )}
    </div>
  );
};

const Profile = () => {
  const { profile, refreshProfile } = useAuth();

  if (profile && !profile.profile_completed) {
    return <ProfileOnboarding />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Profile Header */}
        <div className="flex items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-fraunces">
                {profile?.display_name || profile?.full_name || "Builder"}
              </h1>
              {profile?.full_name && profile?.display_name && (
                <p className="text-sm text-muted-foreground">{profile.full_name}</p>
              )}
              {profile?.neighborhood && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.neighborhood}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dreams & Goals — editable */}
        {profile && (
          <EditableSection
            icon={<Sparkles className="h-4 w-4" />}
            label="Dreams & Goals"
            value={profile.dreams}
            placeholder="What are you dreaming of building in your neighborhood?"
            fieldKey="dreams"
            userId={profile.id}
            onSaved={refreshProfile}
          />
        )}

        {/* Local Tech Ecosystem — editable */}
        {profile && (
          <EditableSection
            icon={<Network className="h-4 w-4" />}
            label="Local Tech Ecosystem"
            value={profile.local_tech_ecosystem}
            placeholder="Describe the relational tech landscape where you live — what exists, what you're tending to, what's emerging…"
            fieldKey="local_tech_ecosystem"
            userId={profile.id}
            onSaved={refreshProfile}
          />
        )}

        {/* Tech Comfort */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Tech Familiarity</p>
            <p className="font-medium capitalize">
              {profile?.tech_familiarity?.replace("_", " ") || "Not set"}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">AI Coding Experience</p>
            <p className="font-medium capitalize">
              {profile?.ai_coding_experience?.replace("_", " ") || "Not set"}
            </p>
          </div>
        </div>

        {/* Serviceberries */}
        <div className="mb-8 p-6 rounded-lg border border-border">
          <ServiceberriesCounter variant="profile" />
        </div>

        {/* Vision Board */}
        <div className="mb-8">
          <VisionBoard />
        </div>

        {/* Commitments */}
        <div className="mb-8">
          <CommitmentsList />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
