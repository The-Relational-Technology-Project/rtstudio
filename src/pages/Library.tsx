import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LibraryCard } from "@/components/LibraryCard";
import { ContributionDialog } from "@/components/ContributionDialog";
import { Search, Plus } from "lucide-react";

type ItemType = "story" | "prompt" | "tool";

interface LibraryItem {
  id: string;
  type: ItemType;
  title: string;
  summary: string;
  author?: string;
  category?: string;
  url?: string;
  fullContent?: string;
  examplePrompt?: string;
  imageUrls?: string[];
}

const Library = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ItemType | "all">("all");
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      const sessionToken = localStorage.getItem("studio_session");
      if (!sessionToken) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-session', {
          body: { token: sessionToken }
        });

        if (error || !data?.valid) {
          localStorage.removeItem("studio_session");
          navigate("/auth");
          return;
        }

        await fetchLibraryItems();
      } catch (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem("studio_session");
        navigate("/auth");
      }
    };

    verifyAccess();
  }, [navigate]);

  // Handle deep linking from URL parameters
  useEffect(() => {
    const itemId = searchParams.get("item");
    if (itemId && items.length > 0) {
      setHighlightedItemId(itemId);
      // Scroll to the item after a brief delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`library-item-${itemId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedItemId(null);
      }, 3000);
    }
  }, [searchParams, items]);

  const fetchLibraryItems = async () => {
    try {
      const [storiesData, promptsData, toolsData] = await Promise.all([
        supabase.from("stories").select("*").order("created_at", { ascending: false }),
        supabase.from("prompts").select("*").order("created_at", { ascending: false }),
        supabase.from("tools").select("*").order("created_at", { ascending: false }),
      ]);

      const allItems: LibraryItem[] = [
        ...(storiesData.data || []).map((story) => ({
          id: story.id,
          type: "story" as ItemType,
          title: story.title || "Untitled Story",
          summary: story.story_text.slice(0, 120) + "...",
          author: story.attribution,
          fullContent: story.full_story_text || story.story_text,
          imageUrls: story.image_urls || [],
        })),
        ...(promptsData.data || []).map((prompt) => ({
          id: prompt.id,
          type: "prompt" as ItemType,
          title: prompt.title,
          summary: prompt.description || "No description",
          category: prompt.category,
          examplePrompt: prompt.example_prompt,
        })),
        ...(toolsData.data || []).map((tool) => ({
          id: tool.id,
          type: "tool" as ItemType,
          title: tool.name,
          summary: tool.description,
          url: tool.url,
        })),
      ];

      setItems(allItems);
      setFilteredItems(allItems);
    } catch (error) {
      console.error("Error fetching library items:", error);
    }
  };

  useEffect(() => {
    let filtered = items;

    if (selectedType !== "all") {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.author?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedType, items]);

  const handleContributionSuccess = () => {
    fetchLibraryItems();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black font-fraunces mb-2">Library</h1>
              <p className="text-muted-foreground">
                Browse stories, prompts, and tools from the community
              </p>
            </div>
            <ContributionDialog 
              open={isContributeOpen} 
              onOpenChange={setIsContributeOpen}
              onSuccess={handleContributionSuccess}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8" data-tour="library-filters">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
              >
                All
              </Button>
              <Button
                variant={selectedType === "story" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("story")}
              >
                Stories
              </Button>
              <Button
                variant={selectedType === "prompt" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("prompt")}
              >
                Prompts
              </Button>
              <Button
                variant={selectedType === "tool" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("tool")}
              >
                Tools
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="library-grid">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No items found. Try adjusting your search or filters.
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  id={`library-item-${item.id}`}
                  data-tour={index === 0 ? "library-card" : undefined}
                  className={`transition-all duration-300 ${
                    highlightedItemId === item.id ? "ring-2 ring-primary rounded-lg" : ""
                  }`}
                >
                  <LibraryCard item={item} />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Library;
