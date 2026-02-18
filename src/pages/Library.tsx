import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LibraryCard } from "@/components/LibraryCard";
import { ContributionDialog } from "@/components/ContributionDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, Star, User } from "lucide-react";
import type { LibraryItem, ItemType } from "@/types/library";

type ViewTab = "browse" | "my-items" | "bookmarks";

const Library = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ItemType | "all">("all");
  const [viewTab, setViewTab] = useState<ViewTab>("browse");
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const fetchLibraryItems = useCallback(async () => {
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
          userId: story.user_id,
        })),
        ...(promptsData.data || []).map((prompt) => ({
          id: prompt.id,
          type: "prompt" as ItemType,
          title: prompt.title,
          summary: prompt.description || "No description",
          category: prompt.category,
          examplePrompt: prompt.example_prompt,
          userId: (prompt as any).user_id,
        })),
        ...(toolsData.data || []).map((tool) => ({
          id: tool.id,
          type: "tool" as ItemType,
          title: tool.name,
          summary: tool.description,
          url: tool.url,
          userId: (tool as any).user_id,
        })),
      ];

      setItems(allItems);
    } catch (error) {
      console.error("Error fetching library items:", error);
    }
  }, []);

  const fetchBookmarks = useCallback(async () => {
    if (!user) { setBookmarkedIds(new Set()); return; }
    const { data } = await supabase
      .from("library_bookmarks" as any)
      .select("item_id")
      .eq("user_id", user.id);
    if (data) {
      setBookmarkedIds(new Set((data as any[]).map((b) => b.item_id)));
    }
  }, [user]);

  useEffect(() => { fetchLibraryItems(); }, [fetchLibraryItems]);
  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  // Deep-link highlight
  useEffect(() => {
    const itemId = searchParams.get("item");
    if (itemId && items.length > 0) {
      setHighlightedItemId(itemId);
      setTimeout(() => {
        document.getElementById(`library-item-${itemId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      setTimeout(() => setHighlightedItemId(null), 3000);
    }
  }, [searchParams, items]);

  // Filtering
  useEffect(() => {
    let filtered = items;

    if (viewTab === "my-items") {
      filtered = filtered.filter((item) => item.userId === user?.id);
    } else if (viewTab === "bookmarks") {
      filtered = filtered.filter((item) => bookmarkedIds.has(item.id));
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.author?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedType, items, viewTab, bookmarkedIds, user]);

  const handleToggleBookmark = async (item: LibraryItem) => {
    if (!user) {
      toast({ title: "Sign in to bookmark items", description: "Create an account to save items for later." });
      return;
    }
    const isCurrentlyBookmarked = bookmarkedIds.has(item.id);
    if (isCurrentlyBookmarked) {
      await supabase
        .from("library_bookmarks" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", item.id);
      setBookmarkedIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    } else {
      await supabase
        .from("library_bookmarks" as any)
        .insert({ user_id: user.id, item_id: item.id, item_type: item.type });
      setBookmarkedIds((prev) => new Set(prev).add(item.id));
    }
  };

  const handleDeleteItem = async (item: LibraryItem) => {
    const tableMap: Record<ItemType, string> = { story: "stories", prompt: "prompts", tool: "tools" };
    const { error } = await supabase.from(tableMap[item.type] as any).delete().eq("id", item.id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `"${item.title}" has been removed.` });
      fetchLibraryItems();
    }
  };

  const emptyMessages: Record<ViewTab, string> = {
    browse: "No items found. Try adjusting your search or filters.",
    "my-items": user ? "You haven't contributed any items yet. Use the Contribute button to add something!" : "Sign in to see items you've contributed.",
    bookmarks: user ? "No bookmarks yet. Browse the library and bookmark items to save them here." : "Sign in to see your bookmarks.",
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
              onSuccess={fetchLibraryItems}
            />
          </div>

          {/* View tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            {(["browse", "my-items", "bookmarks"] as ViewTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  viewTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "browse" && <BookOpen className="h-3.5 w-3.5" />}
                {tab === "my-items" && <User className="h-3.5 w-3.5" />}
                {tab === "bookmarks" && <Star className="h-3.5 w-3.5" />}
                {tab === "browse" ? "Browse" : tab === "my-items" ? "My Items" : "Bookmarks"}
              </button>
            ))}
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
              {(["all", "story", "prompt", "tool"] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type === "all" ? "All" : type === "story" ? "Stories" : type === "prompt" ? "Prompts" : "Tools"}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="library-grid">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {emptyMessages[viewTab]}
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
                  <LibraryCard
                    item={item}
                    isBookmarked={bookmarkedIds.has(item.id)}
                    onToggleBookmark={handleToggleBookmark}
                    isOwned={!!user && item.userId === user.id}
                    onEdit={fetchLibraryItems}
                    onDelete={() => handleDeleteItem(item)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Library;
