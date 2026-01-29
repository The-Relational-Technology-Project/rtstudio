export type ItemType = "story" | "prompt" | "tool";

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
}
