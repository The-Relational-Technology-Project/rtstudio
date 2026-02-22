export type ItemType = "story" | "prompt" | "tool" | "tech_for_building";

export interface ChildPrompt {
  id: string;
  title: string;
  description?: string;
  examplePrompt: string;
  category: string;
}

export interface LibraryItem {
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
  userId?: string | null;
  imageUrl?: string;
  screenshotUrls?: string[];
  toolCategory?: string;
  childPrompts?: ChildPrompt[];
}
