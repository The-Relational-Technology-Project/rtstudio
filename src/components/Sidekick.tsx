import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Send, Sparkles, Gift, RotateCcw, FileText, Check, Loader2 } from "lucide-react";
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
  onCreateBuildPlan?: (libraryItemIds: string[]) => void;
  plansRemaining?: number;
  previewSlot?: React.ReactNode;
  buildPlanState?: "idle" | "generating" | "ready";
  onLibraryItemsChange?: (items: LibraryItemData[]) => void;
  /** When true, render referenced library items inline at the bottom of the
   * message scroll area on mobile. Used by Home so the aside collapses into
   * the chat flow below `lg` (where the side aside is hidden). */
  showInlineLibraryItems?: boolean;
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

export const Sidekick = ({ initialPrompt, onClearInitialPrompt, fullPage = false, onCreateBuildPlan, plansRemaining = 10, previewSlot, buildPlanState = "idle", onLibraryItemsChange, showInlineLibraryItems = false }: SidekickProps) => {
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
    const container = messagesContainerRef.current;
    if (container && messages.length > 0) {
      const messageElements = container.querySelectorAll('[data-message-index]');
      const lastMessageElement = messageElements[messageElements.length - 1] as HTMLElement | undefined;
      if (lastMessageElement) {
        const offsetTop = lastMessageElement.offsetTop - container.offsetTop;
        container.scrollTo({ top: offsetTop, behavior: 'smooth' });
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
      
      // Use raw fetch (not supabase.functions.invoke) so we can pass the JWT
      // directly — invoke can drop the user's Authorization header, which makes
      // chat-remix treat the request as a guest and breaks auth-gated tools
      // like request_steward_connect.
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/chat-remix`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ messages: enrichedMessages }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Chat failed (${res.status})`);
      }

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

  // Listen for external prefill requests (e.g. "Talk to an RTP steward" button
  // on the build plan preview). Drop the suggested text into the chat box and
  // focus it — never auto-send, so the builder can edit first.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string }>).detail;
      if (!detail?.text) return;
      setInput(detail.text);
      window.setTimeout(() => {
        const chat = document.getElementById("sidekick-chat");
        const textarea = chat?.querySelector("textarea") as HTMLTextAreaElement | null;
        textarea?.focus();
        if (textarea) textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }, 50);
    };
    window.addEventListener("sidekick:prefill", handler as EventListener);
    return () => window.removeEventListener("sidekick:prefill", handler as EventListener);
  }, []);

  // Extract library items from new assistant messages only
  useEffect(() => {
    messages.forEach((message, index) => {
      if (message.role === "assistant" && !processedMessageIdsRef.current.has(index)) {
        extractLibraryItems(message.content);
        processedMessageIdsRef.current.add(index);
      }
    });
  }, [messages]);

  // Notify parent of library item changes (used by Home to render in side panel)
  useEffect(() => {
    onLibraryItemsChange?.(libraryItems);
  }, [libraryItems, onLibraryItemsChange]);

  // Auto-send new user messages from context (e.g., from Library remix)
  useEffect(() => {
    const processNewUserMessage = async () => {
      const lastMessage = messages[messages.length - 1];
      
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

    if (newLibraryItems.length > 0) {
      setLibraryItems(prev => {
        const existingIds = prev.map(item => item.id);
        const uniqueNewItems = newLibraryItems.filter(item => !existingIds.includes(item.id));
        return [...uniqueNewItems, ...prev];
      });
    }
  };

  const formatMessageContent = (content: string): { text: string; readyForBuildPlan: boolean } => {
    // Strip any legacy ---PROMPT_START---/---PROMPT_END--- block (Gemini sometimes
    // still emits one despite the system prompt; drop it on the floor — the chat is
    // the brief now, Opus writes the prompt via Create build plan).
    let cleaned = content;
    const ps = cleaned.indexOf('---PROMPT_START---');
    const pe = cleaned.indexOf('---PROMPT_END---');
    if (ps !== -1 && pe !== -1 && pe > ps) {
      cleaned = (cleaned.substring(0, ps) + cleaned.substring(pe + '---PROMPT_END---'.length)).trim();
    }

    // Detect and strip the ready-for-build-plan sentinel.
    const readyMatch = /\[READY_FOR_BUILD_PLAN\]/.exec(cleaned);
    let readyForBuildPlan = readyMatch !== null;
    if (readyForBuildPlan) {
      cleaned = cleaned.replace(/\[READY_FOR_BUILD_PLAN\]/g, '').trim();
    }

    // Defensive fallback: if Gemini regresses to the old flow and writes a
    // "Here is a prompt you can use to build this" line (or similar), treat it
    // as a missed sentinel so the Create build plan button still appears and
    // the builder isn't stuck. The chat IS the brief — Opus will write the
    // actual prompt when they tap the button.
    if (!readyForBuildPlan) {
      const oldFlowSignals = [
        /here\s+is\s+a\s+prompt\s+you\s+can\s+use/i,
        /here'?s\s+a\s+prompt\s+(to|you can)/i,
        /you\s+can\s+build\s+a\s+prototype\s+here\s+in\s+studio/i,
        /take\s+this\s+prompt\s+to\s+(claude\s+code|lovable|dyad)/i,
      ];
      if (oldFlowSignals.some((re) => re.test(cleaned))) {
        readyForBuildPlan = true;
      }
    }

    const withLibraryLinks = cleaned.replace(/\[LIBRARY_ITEM:(\w+):([^:]+):([^\]]+)\]/g, '[LIBRARY_LINK:$2:$3]');
    return { text: withLibraryLinks, readyForBuildPlan };
  };

  const renderFormattedText = (text: string) => {
    // Split on both bold markers and library link markers
    const parts = text.split(/(\*\*[^*]+\*\*|\[LIBRARY_LINK:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-semibold text-primary">{part.slice(2, -2)}</span>;
      }
      const linkMatch = part.match(/^\[LIBRARY_LINK:([^:]+):([^\]]+)\]$/);
      if (linkMatch) {
        const [, id, title] = linkMatch;
        return (
          <button
            key={i}
            onClick={() => navigate(`/library?item=${id}`)}
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors cursor-pointer"
          >
            {title}
          </button>
        );
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

  const chatBody = (
    <>
      <div className={`flex items-center justify-between ${fullPage ? "px-4 sm:px-6 py-3 border-b border-border/50" : "p-4 sm:p-6 pb-0"} shrink-0`}>
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
                onClick={() => setInput("I'd like to remix a tool for my neighborhood")}
                className="text-xs"
              >
                Remix a tool
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("I have an idea for something I want to build for my neighborhood")}
                className="text-xs"
              >
                Discuss an idea
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput("I'd like to contribute something to the commons")}
                className="text-xs"
              >
                <Gift className="w-3 h-3 mr-1" />
                Contribute something
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

            const parsed = formatMessageContent(message.content);

            return (
              <div key={idx} data-message-index={idx} className="flex justify-start">
                <div className="max-w-[85%] space-y-3">
                  {parsed.text && (
                    <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{renderFormattedText(parsed.text)}</p>
                    </div>
                  )}
                  {parsed.readyForBuildPlan && onCreateBuildPlan && (
                    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                      <Button
                        onClick={() => onCreateBuildPlan(libraryItems.map((i) => i.id))}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-100"
                        disabled={
                          plansRemaining <= 0 ||
                          buildPlanState === "generating" ||
                          buildPlanState === "ready"
                        }
                      >
                        {buildPlanState === "generating" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating build plan…
                          </>
                        ) : buildPlanState === "ready" ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Build plan created
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Create build plan
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {buildPlanState === "generating"
                          ? "Claude Opus is drafting your detailed prompt and plan — usually 20–40 seconds."
                          : buildPlanState === "ready"
                          ? "Your build plan is ready below."
                          : "Claude Opus will write a detailed prompt and a builder plan from this conversation."}
                      </p>
                    </div>
                  )}
                  {!parsed.readyForBuildPlan && (
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

      <form onSubmit={handleSend} className={`flex gap-2 shrink-0 ${fullPage ? "px-4 sm:px-6 py-3 border-t border-border/50" : "p-4 sm:p-6 pt-0 border-t border-border/50"}`} data-tour="chat-input">
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
    </>
  );

  if (fullPage) {
    // Full-bleed mode: chat fills its parent's height; no Card chrome.
    // Parent (Home) renders referenced library items + build plan in a side panel.
    return (
      <div id="sidekick-chat" className="flex flex-col h-full w-full bg-background">
        {chatBody}
      </div>
    );
  }

  return (
    <div id="sidekick-chat" className="w-full max-w-5xl mx-auto mb-8 scroll-mt-20 flex flex-col gap-4">
      <Card className="flex flex-col border-2 border-primary/30 shadow-xl bg-gradient-to-b from-primary/5 to-background h-[500px]">
        {chatBody}
      </Card>

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

      {previewSlot}

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
