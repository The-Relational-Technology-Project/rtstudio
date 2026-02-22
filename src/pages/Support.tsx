import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold font-fraunces mb-3">Get Support</h1>
        <p className="text-muted-foreground mb-12">
          Resources and guidance for builders working at the intersection of technology and community.
        </p>

        {/* Builder's Guide */}
        <section className="mb-10 p-6 rounded-lg bg-muted/50 border border-border">
          <h2 className="text-xl font-semibold font-fraunces mb-3">The Builder's Guide</h2>
          <p className="text-sm text-foreground mb-4">
            The Builder's Guide includes practical ideas for how to go about building relational tech.
            Informed by our experiences building in our neighborhoods, it describes a "spiral" of
            widening and deepening circles.
          </p>
          <Button asChild>
            <a href="/Builders_Guide_RTP.pdf" download>
              <Download className="mr-2 h-4 w-4" />
              Download the Builder's Guide
            </a>
          </Button>
        </section>

        {/* 1:1 Jam Session */}
        <section className="p-6 rounded-lg bg-muted/50 border border-border">
          <h2 className="text-xl font-semibold font-fraunces mb-3">1:1 Jam Session</h2>
          <p className="text-sm text-foreground mb-4">
            Josh, one of the stewards of the Relational Tech Project, is available for 1:1
            conversations about building and remixing relational tech. These sessions range from
            just getting started, to the details of design and implementation, to co-creation.
          </p>
          <Button asChild>
            <a href="https://cal.com/joshnesbit" target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" />
              Book a Jam Session
            </a>
          </Button>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Support;
