import { useState } from "react";
import DOMPurify from "dompurify";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ExternalLink, MessageSquare, Sparkles, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidekick } from "@/contexts/SidekickContext";

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

interface LibraryCardProps {
  item: LibraryItem;
}

export const LibraryCard = ({ item }: LibraryCardProps) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const navigate = useNavigate();
  const { setMessages } = useSidekick();

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case "story":
        return "bg-primary/10 text-primary border-primary/20";
      case "prompt":
        return "bg-accent/10 text-accent border-accent/20";
      case "tool":
        return "bg-secondary text-secondary-foreground border-border";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDiscussInSidekick = () => {
    const promptText = item.examplePrompt || item.title;
    const contextMessage = `I'd like to remix this prompt: "${promptText}"`;
    setMessages([{ role: "user", content: contextMessage }]);
    navigate("/");
  };

  return (
    <>
      <Card className="flex flex-col hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="outline" className={getTypeColor(item.type)}>
              {item.type}
            </Badge>
          </div>
          <CardTitle className="text-xl font-fraunces line-clamp-2">{item.title}</CardTitle>
          {item.author && (
            <CardDescription className="text-xs">by {item.author}</CardDescription>
          )}
          {item.category && (
            <CardDescription className="text-xs">{item.category}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{item.summary}</p>
        </CardContent>
        <CardFooter className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(true)}>
            <BookOpen className="w-3 h-3 mr-1" />
            View
          </Button>
          {item.type === "tool" && item.url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(item.url, "_blank")}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Visit
            </Button>
          )}
          {item.type === "prompt" && (
            <Button variant="ghost" size="sm" onClick={handleDiscussInSidekick}>
              <Sparkles className="w-3 h-3 mr-1" />
              Remix
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="outline" className={getTypeColor(item.type)}>
                {item.type}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-fraunces">{item.title}</DialogTitle>
            {item.author && (
              <p className="text-sm text-muted-foreground">by {item.author}</p>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            {item.type === "story" && item.fullContent && (
              <>
                <div className="bg-secondary/50 border border-border p-4 rounded-lg">
                  <div 
                    className="text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.fullContent) }}
                  />
                </div>
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Story image ${index + 1}`}
                        className="w-full rounded-lg border border-border"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            
            {item.type === "prompt" && item.examplePrompt && (
              <div className="bg-secondary/50 border border-border p-4 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.examplePrompt}</p>
              </div>
            )}
            
            {item.type === "tool" && (
              <div className="space-y-2">
                <p className="text-sm leading-relaxed">{item.summary}</p>
                {item.url && (
                  <Button variant="outline" onClick={() => window.open(item.url, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Tool
                  </Button>
                )}
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={handleDiscussInSidekick} className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Discuss in Sidekick
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
