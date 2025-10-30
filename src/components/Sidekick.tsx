import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Send, Sparkles } from "lucide-react";
import { useSidekick } from "@/contexts/SidekickContext";

interface SidekickProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const Sidekick = ({ initialPrompt, onClearInitialPrompt }: SidekickProps) => {
  const location = useLocation();
  const { messages, setMessages } = useSidekick();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt) {
      handleRemixPrompt(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  const getContextMessage = () => {
    const path = location.pathname;
    if (path === "/") {
      return "I'm here to help you explore community stories and discuss how relational technology is being used in neighborhoods. Ask me about any story details or tools mentioned!";
    } else if (path === "/prompt-pond") {
      return "I'm here to help you remix prompts for your neighborhood! Share a prompt you'd like to adapt, or ask me questions about the prompts in the library.";
    } else if (path === "/tools") {
      return "I'm here to help you explore tools for building relational technology. Ask me which tools might work best for your project, or get recommendations based on your needs!";
    }
    return "I'm here to help you explore, plan, and build with relational technology. How can I assist you?";
  };

  const handleRemixPrompt = async (promptText: string) => {
    const userMessage = `Let's remix this prompt for my neighborhood!\n\n${promptText}`;
    setMessages([{ role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-remix", {
        body: { messages: [{ role: "user", content: userMessage }] }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-remix", {
        body: { messages: newMessages }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  return (
    <Card className="h-full flex flex-col border border-border shadow-sm">
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold font-fraunces">Sidekick</h2>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="space-y-4 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold">Start a conversation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getContextMessage()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-y-auto pr-2 mb-4">
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-xl ${
                    message.role === "user"
                      ? "bg-primary/10 border border-primary/20 text-foreground"
                      : "bg-secondary/50 border border-border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
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
      </div>
    </Card>
  );
};
