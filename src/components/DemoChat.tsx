import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { Send, Sparkles, BookOpen, Wrench, ArrowRight, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MESSAGE_LIMIT = 10;

const DemoChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const hasReachedLimit = messageCount >= MESSAGE_LIMIT;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || hasReachedLimit) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setMessageCount(prev => prev + 1);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-remix", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          demoMode: true
        }
      });

      if (error) throw error;

      const responseText = data?.response || "I'm having trouble responding right now.";
      // Strip library item markers from demo mode responses
      const cleanedResponse = responseText.replace(/\[LIBRARY_ITEM:[^\]]+\]/g, '').trim();
      
      setMessages(prev => [...prev, { role: "assistant", content: cleanedResponse }]);
    } catch (error) {
      console.error("Demo chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I couldn't process that. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleStartFresh = () => {
    setMessages([]);
    setMessageCount(0);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-fraunces font-bold text-foreground">Try Sidekick</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative">
        <ScrollArea className="h-[300px] px-6 py-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask about relational tech, explore stories from neighborhoods, and get help remixing tools for your community.
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction("Remix a prompt for a block party in my neighborhood")}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Remix Something
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction("Show me stories of neighbors building tech together")}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Discover Stories
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction("What tools can help neighbors share resources?")}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Explore Tools
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground rounded-2xl px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Limit Reached Overlay */}
        {hasReachedLimit && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-fraunces font-bold text-foreground mb-2">
                You've explored {MESSAGE_LIMIT} messages!
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up to unlock the full Studio:
              </p>
              <ul className="text-sm text-muted-foreground mb-6 space-y-1">
                <li>• Save and track your commitments</li>
                <li>• Contribute your stories to the library</li>
                <li>• Connect with other neighborhood builders</li>
              </ul>
              <div className="flex flex-col gap-2">
                <Link to="/auth">
                  <Button className="w-full">
                    Enter Your Studio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleStartFresh}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Start Fresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-border bg-card/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What would you like to explore?"
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={isLoading || hasReachedLimit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || hasReachedLimit}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {messages.length > 0 && !hasReachedLimit && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {MESSAGE_LIMIT - messageCount} messages remaining in demo
          </p>
        )}
      </form>
    </div>
  );
};

export default DemoChat;
