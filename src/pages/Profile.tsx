import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";
import { Button } from "@/components/ui/button";
import { User, MapPin, Sparkles, Settings } from "lucide-react";

const Profile = () => {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Show onboarding if profile is not completed
  if (profile && !profile.profile_completed) {
    return <ProfileOnboarding />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-fraunces">
                {profile?.display_name || "Builder"}
              </h1>
              {profile?.neighborhood && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.neighborhood}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Dreams Section */}
        {profile?.dreams && (
          <div className="mb-8 p-6 rounded-lg bg-muted/50 border border-border">
            <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Dreams & Goals
            </h2>
            <p className="text-foreground">{profile.dreams}</p>
          </div>
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

        {/* Vision Board Placeholder */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Vision Board</h2>
          <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
            <p className="text-muted-foreground">
              Your vision board will appear here. Upload images that inspire your neighborhood dreams.
            </p>
            <Button variant="outline" className="mt-4" disabled>
              Coming Soon
            </Button>
          </div>
        </div>

        {/* Commitments Placeholder */}
        <div>
          <h2 className="text-lg font-bold mb-4">Commitments</h2>
          <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
            <p className="text-muted-foreground">
              Commitments you make during chat sessions will be tracked here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
