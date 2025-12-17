import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Send, Sparkles, Gift } from "lucide-react";
import { useSidekick } from "@/contexts/SidekickContext";
import { LibraryItemPreview } from "@/components/LibraryItemPreview";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SidekickProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  fullPage?: boolean;
}

interface LibraryItemData {
  id: string;
  type: "story" | "prompt" | "tool";
  title: string;
  summary: string;
  author?: string;
  category?: string;
}

interface ContributionData {
  type: "story" | "prompt" | "tool";
  id: string;
  title: string;
}

export const Sidekick = ({ initialPrompt, onClearInitialPrompt, fullPage = false }: SidekickProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { messages, setMessages } = useSidekick();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItemData[]>([]);
  const [recentContribution, setRecentContribution] = useState<ContributionData | null>(null);
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastProcessedIndexRef = useRef(-1);
  const processedMessageIdsRef = useRef(new Set<number>());

  const scrollToLatestMessage = () => {
    if (messagesContainerRef.current && messages.length > 0) {
      const messageElements = messagesContainerRef.current.querySelectorAll('[data-message-index]');
      const lastMessageElement = messageElements[messageElements.length - 1];
      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Centralized API call function
  const sendMessage = async (messagesToSend: Message[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat-remix", {
        body: { messages: messagesToSend }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      
      // Check if a contribution was made
      if (data?.contribution) {
        setRecentContribution(data.contribution);
        toast({
          title: "Gift Added to the Commons!",
          description: `Your ${data.contribution.type} "${data.contribution.title}" is now in the library.`,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToLatestMessage();
  }, [messages]);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt) {
      setMessages([{ role: "user", content: initialPrompt }]);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Extract library items from new assistant messages only
  useEffect(() => {
    messages.forEach((message, index) => {
      if (message.role === "assistant" && !processedMessageIdsRef.current.has(index)) {
        extractLibraryItems(message.content);
        processedMessageIdsRef.current.add(index);
      }
    });
  }, [messages]);

  // Auto-send new user messages from context (e.g., from Library remix)
  useEffect(() => {
    const processNewUserMessage = async () => {
      const lastMessage = messages[messages.length - 1];
      
      // Only process if: new message exists, it's from user, we're not loading, and we haven't processed it yet
      if (
        messages.length > lastProcessedIndexRef.current + 1 &&
        lastMessage?.role === "user" &&
        !isLoading &&
        (messages.length === 1 || messages[messages.length - 2]?.role !== "user")
      ) {
        lastProcessedIndexRef.current = messages.length - 1;
        await sendMessage(messages);
      }
    };

    processNewUserMessage();
  }, [messages, isLoading]);

  const getWelcomeMessage = () => {
    return "I can help you learn about relational tech and build your own tools. What are we crafting today?";
  };

  const extractLibraryItems = (content: string) => {
    const regex = /\[LIBRARY_ITEM:(\w+):([^:]+):([^\]]+)\]/g;
    const newLibraryItems: LibraryItemData[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const [, type, id, title] = match;
      newLibraryItems.push({
        id,
        type: type as "story" | "prompt" | "tool",
        title,
        summary: "",
      });
    }

    // Update library items state (add new items at the top)
    if (newLibraryItems.length > 0) {
      setLibraryItems(prev => {
        const existingIds = prev.map(item => item.id);
        const uniqueNewItems = newLibraryItems.filter(item => !existingIds.includes(item.id));
        return [...uniqueNewItems, ...prev];
      });
    }
  };

  const formatMessageContent = (content: string): string => {
    // Replace [LIBRARY_ITEM:type:id:title] with just the title in the text
    return content.replace(/\[LIBRARY_ITEM:\w+:[^:]+:([^\]]+)\]/g, '**$1**');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    await sendMessage(newMessages);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  const viewInLibrary = () => {
    if (recentContribution) {
      navigate(`/library?item=${recentContribution.id}`);
    }
  };

  return (
    <div id="sidekick-chat" className={`w-full ${fullPage ? 'max-w-4xl' : 'max-w-5xl'} mx-auto ${!fullPage && 'mb-8'} scroll-mt-20 flex flex-col gap-4`}>
      <Card className={`flex flex-col border-2 border-primary/30 shadow-xl bg-gradient-to-b from-primary/5 to-background ${fullPage ? 'h-[500px]' : 'h-[500px]'}`}>
        <div className="flex items-center gap-2 p-4 sm:p-6 pb-0 shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold font-fraunces">Sidekick</h2>
        </div>

        {messages.length === 0 ? (
          <div className="flex items-center justify-center text-center px-4 py-8 sm:py-12 flex-1">
            <div className="space-y-4 max-w-lg">
              <p className="text-base sm:text-lg text-foreground leading-relaxed">
                {getWelcomeMessage()}
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-4" data-tour="quick-actions">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("Help me find a prompt to remix")}
                  className="text-xs"
                >
                  Remix Something
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("Show me some community stories")}
                  className="text-xs"
                >
                  Discover Stories
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("What tools can help me organize a block party?")}
                  className="text-xs"
                >
                  Explore Tools
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("I want to share something that worked in my neighborhood")}
                  className="text-xs"
                >
                  <Gift className="w-3 h-3 mr-1" />
                  Contribute
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-y-auto px-4 sm:px-6 py-4">
            {messages.map((message, idx) => {
              // Format the message content
              const displayContent = message.role === "assistant" 
                ? formatMessageContent(message.content)
                : message.content;

              // Split by markdown bold (**text**) for rendering
              const parts = displayContent.split(/(\*\*[^*]+\*\*)/g);

              return (
                <div key={idx} data-message-index={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%]`}>
                    <div
                      className={`p-3 rounded-xl ${
                        message.role === "user"
                          ? "bg-primary/10 border border-primary/20 text-foreground"
                          : "bg-secondary/50 border border-border"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {parts.map((part, partIndex) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <span key={partIndex} className="font-semibold text-primary">
                                {part.slice(2, -2)}
                              </span>
                            );
                          }
                          return <span key={partIndex}>{part}</span>;
                        })}
                      </p>
                      {message.role === "assistant" && (
                        <Button
                          onClick={() => copyToClipboard(message.content)}
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 shrink-0 p-4 sm:p-6 pt-0 border-t border-border/50" data-tour="chat-input">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chat here..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="self-end bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      {/* Recent contribution banner */}
      {recentContribution && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Your gift was added to the commons!</p>
                <p className="text-xs text-muted-foreground">"{recentContribution.title}" is now in the library</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={viewInLibrary}>
              View in Library
            </Button>
          </div>
        </Card>
      )}

      {libraryItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-2">Referenced Library Items</h3>
          <div className="space-y-2">
            {libraryItems.map((item) => (
              <LibraryItemPreview key={item.id} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};