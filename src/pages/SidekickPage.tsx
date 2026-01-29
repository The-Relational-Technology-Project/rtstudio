import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Sidekick } from "@/components/Sidekick";

const SidekickPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <Sidekick fullPage />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SidekickPage;
