import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileOnboarding } from "@/components/ProfileOnboarding";
import { VisionBoard } from "@/components/VisionBoard";
import { CommitmentsList } from "@/components/CommitmentsList";
import { ServiceberriesCounter } from "@/components/ServiceberriesCounter";
import { User, MapPin, Sparkles } from "lucide-react";

const Profile = () => {
  const { profile } = useAuth();

  // Show onboarding if profile is not completed
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
