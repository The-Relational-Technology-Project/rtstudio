import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Send, Sparkles } from "lucide-react";
interface Message {
  role: "user" | "assistant";
  content: string;
}
interface PromptChatProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}
export const PromptChat = ({
  initialPrompt,
  onClearInitialPrompt
}: PromptChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
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
  const handleRemixPrompt = async (promptText: string) => {
    const userMessage = `Let's remix this prompt for my neighborhood!\n\n${promptText}`;
    setMessages([{
      role: "user",
      content: userMessage
    }]);
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("chat-remix", {
        body: {
          messages: [{
            role: "user",
            content: userMessage
          }]
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process message",
        variant: "destructive"
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
    const newMessages: Message[] = [...messages, {
      role: "user",
      content: userMessage
    }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("chat-remix", {
        body: {
          messages: newMessages
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard."
    });
  };
  return <Card className="w-full max-w-4xl mx-auto border border-border shadow-sm">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold font-fraunces">Relational Tech Sidekick</h2>
        </div>
        
        {messages.length === 0 ? <div className="text-center py-6 space-y-2">
            
          </div> : <div ref={messagesContainerRef} className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {messages.map((message, idx) => <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 sm:p-4 rounded-xl ${message.role === "user" ? "bg-primary/10 border border-primary/20 text-foreground" : "bg-secondary/50 border border-border"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  {message.role === "assistant" && <Button onClick={() => copyToClipboard(message.content)} variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>}
                </div>
              </div>)}
            {isLoading && <div className="flex justify-start">
                <div className="max-w-[85%] p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
                </div>
              </div>}
          </div>}

        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about remixing a prompt or building tools for your community..." className="min-h-[60px] resize-none" onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
          }
        }} />
          <Button type="submit" disabled={isLoading || !input.trim()} className="self-end bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>;
};