import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Send, Sparkles, Gift, ExternalLink, RotateCcw } from "lucide-react";
import { useSidekick } from "@/contexts/SidekickContext";
import { useAuth } from "@/contexts/AuthContext";
import { LibraryItemPreview } from "@/components/LibraryItemPreview";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SidekickProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  fullPage?: boolean;
  onBuildIt?: (summaryPrompt: string) => void;
  buildsRemaining?: number;
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
  const { messages, setMessages, clearMessages } = useSidekick();
  const { user, profile } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [libraryItems, setLibraryItems] = useState<LibraryItemData[]>([]);
  const [recentContribution, setRecentContribution] = useState<ContributionData | null>(null);
  const [contributionHistory, setContributionHistory] = useState<ContributionData[]>([]);

  const loadingMessages = [
    "Thinking...",
    "Searching our library...",
    "Drafting..."
  ];
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
      const { data: { session } } = await supabase.auth.getSession();
      
      // Inject contribution history as context notes to prevent re-submission
      let enrichedMessages = [...messagesToSend];
      if (contributionHistory.length > 0) {
        const contextNote = contributionHistory.map(c => 
          `NOTE: A ${c.type} titled "${c.title}" was already submitted to the library in this conversation. Do not submit it again.`
        ).join('\n');
        enrichedMessages = [
          { role: "user" as const, content: contextNote },
          { role: "assistant" as const, content: "Understood, I will not re-submit those items." },
          ...messagesToSend
        ];
      }
      
      const { data, error } = await supabase.functions.invoke("chat-remix", {
        body: { 
          messages: enrichedMessages
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      
      // Check if a contribution was made
      if (data?.contribution) {
        const contrib = data.contribution;
        setRecentContribution(contrib);
        setContributionHistory(prev => [...prev, contrib]);
        toast({
          title: "Gift Added to the Commons!",
          description: `Your ${contrib.type} "${contrib.title}" is now in the library.`,
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

  // Loading phase transitions
  useEffect(() => {
    if (!isLoading) {
      setLoadingPhase(0);
      return;
    }
    
    const timer1 = setTimeout(() => setLoadingPhase(1), 2000);
    const timer2 = setTimeout(() => setLoadingPhase(2), 5000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);

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
    const greeting = profile?.display_name ? `Hi ${profile.display_name}! ` : "";
    return `${greeting}I can help you learn about relational tech and build your own tools. What would you like to explore?`;
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

  const formatMessageContent = (content: string): { before: string; prompt: string | null; after: string } => {
    // Check for prompt delimiters
    const promptStartIdx = content.indexOf('---PROMPT_START---');
    const promptEndIdx = content.indexOf('---PROMPT_END---');
    
    if (promptStartIdx !== -1 && promptEndIdx !== -1 && promptEndIdx > promptStartIdx) {
      const before = content.substring(0, promptStartIdx).replace(/\[LIBRARY_ITEM:\w+:[^:]+:([^\]]+)\]/g, '**$1**').trim();
      const prompt = content.substring(promptStartIdx + '---PROMPT_START---'.length, promptEndIdx).trim();
      const after = content.substring(promptEndIdx + '---PROMPT_END---'.length).replace(/\[LIBRARY_ITEM:\w+:[^:]+:([^\]]+)\]/g, '**$1**').trim();
      return { before, prompt, after };
    }
    
    // No delimiters — return everything as "before"
    const cleaned = content.replace(/\[LIBRARY_ITEM:\w+:[^:]+:([^\]]+)\]/g, '**$1**');
    return { before: cleaned, prompt: null, after: '' };
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-semibold text-primary">{part.slice(2, -2)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
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
        <div className="flex items-center justify-between p-4 sm:p-6 pb-0 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-fraunces">Sidekick</h2>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { clearMessages(); setLibraryItems([]); setRecentContribution(null); setContributionHistory([]); }}
              className="text-xs text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              New Chat
            </Button>
          )}
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
                  onClick={() => setInput("I'd like to customize a tool for my neighborhood")}
                  className="text-xs"
                >
                  Customize a tool
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("Show me stories from neighbors")}
                  className="text-xs"
                >
                  Read neighbor stories
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setInput("What neighborhood tools are in the library?")}
                  className="text-xs"
                >
                  Browse tools
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
              if (message.role === "user") {
                return (
                  <div key={idx} data-message-index={idx} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Assistant message — check for prompt block
              const parsed = formatMessageContent(message.content);

              return (
                <div key={idx} data-message-index={idx} className="flex justify-start">
                  <div className="max-w-[85%] space-y-3">
                    {parsed.before && (
                      <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{renderBoldText(parsed.before)}</p>
                      </div>
                    )}
                    {parsed.prompt && (
                      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed font-mono">{parsed.prompt}</p>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/20">
                          <Button
                            onClick={() => copyToClipboard(parsed.prompt!)}
                            size="sm"
                            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy Prompt
                          </Button>
                        </div>
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-muted-foreground">Paste your prompt into any of these to start building:</p>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open("https://lovable.dev", "_blank")}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Lovable
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open("https://claude.ai/code", "_blank")}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Claude Code
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open("https://dyad.sh", "_blank")}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Dyad
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {parsed.after && (
                      <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{renderBoldText(parsed.after)}</p>
                      </div>
                    )}
                    {!parsed.prompt && (
                      <Button
                        onClick={() => copyToClipboard(message.content)}
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {loadingMessages[loadingPhase]}
                  </p>
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