import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventsSection } from "@/components/network/EventsSection";
import { NetworkUpdatesSection } from "@/components/network/NetworkUpdatesSection";
import { SuggestJamSession } from "@/components/network/SuggestJamSession";
import { DeveloperResources } from "@/components/network/DeveloperResources";
import { Calendar, Music, Radio, Terminal } from "lucide-react";

const Network = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-fraunces text-foreground mb-3">
            Network
          </h1>
          <p className="text-muted-foreground">
            Gatherings, updates, and resources from across the relational tech network.
          </p>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto">
            <TabsTrigger value="events" className="gap-1.5 py-2.5">
              <Calendar className="h-3.5 w-3.5" />
              Events
            </TabsTrigger>
            <TabsTrigger value="jam" className="gap-1.5 py-2.5">
              <Music className="h-3.5 w-3.5" />
              Suggest a Jam
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-1.5 py-2.5">
              <Radio className="h-3.5 w-3.5" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="dev" className="gap-1.5 py-2.5">
              <Terminal className="h-3.5 w-3.5" />
              Developer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-0">
            <EventsSection />
          </TabsContent>
          <TabsContent value="jam" className="mt-0">
            <SuggestJamSession />
          </TabsContent>
          <TabsContent value="updates" className="mt-0">
            <NetworkUpdatesSection />
          </TabsContent>
          <TabsContent value="dev" className="mt-0">
            <DeveloperResources />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Network;
