import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, BookOpen, Users, ArrowRight } from "lucide-react";
const Landing = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();

  // Redirect authenticated users to Sidekick
  useEffect(() => {
    if (user) {
      navigate("/sidekick", {
        replace: true
      });
    }
  }, [user, navigate]);
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-32">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-fraunces text-foreground mb-6 leading-tight">
              Relational Tech Studio
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Your space to craft technology that serves your people and place.</p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <FeatureCard icon={<Sparkles className="h-6 w-6" />} title="Sidekick" description="Chat to explore ideas and move into action locally" delay="0.1s" />
            <FeatureCard icon={<BookOpen className="h-6 w-6" />} title="Library" description="Stories, prompts, and tools shared by people building with neighbors" delay="0.2s" />
            <FeatureCard icon={<Users className="h-6 w-6" />} title="Peer Network" description="Join fellow builders crafting relational technology for their neighborhoods" delay="0.3s" />
          </div>

          {/* CTA Section */}
          <div className="text-center animate-fade-in" style={{
          animationDelay: "0.4s"
        }}>
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-scale">
                Enter the Studio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section - What is this? */}
      <div className="bg-card/50 border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-fraunces font-bold text-foreground mb-4">
            What is Relational Tech?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Technology that helps us reconnect and care for each other. Small software built by people for a place. Tools we can reuse and remix across our neighborhoods.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Part of the{" "}
            <a href="https://relationaltechproject.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Relational Tech Project
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>Made with care for neighbors everywhere</p>
      </footer>
    </div>;
};
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}
const FeatureCard = ({
  icon,
  title,
  description,
  delay = "0s"
}: FeatureCardProps) => <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in" style={{
  animationDelay: delay
}}>
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-fraunces font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>;
export default Landing;