import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, BookOpen, Lightbulb, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ItemType } from "@/types/library";

interface LibraryItemPreviewProps {
  id: string;
  type: ItemType;
  title: string;
  summary: string;
  author?: string;
  category?: string;
}

const getTypeConfig = (type: ItemType) => {
  switch (type) {
    case "story":
      return {
        icon: BookOpen,
        label: "Story",
        className: "bg-[#FD7E14]/10 text-[#FD7E14] border-[#FD7E14]/20",
      };
    case "prompt":
      return {
        icon: Lightbulb,
        label: "Prompt",
        className: "bg-[#20C997]/10 text-[#20C997] border-[#20C997]/20",
      };
    case "tool":
      return {
        icon: Wrench,
        label: "Tool",
        className: "bg-[#6C757D]/10 text-[#6C757D] border-[#6C757D]/20",
      };
  }
};

export const LibraryItemPreview = ({
  id,
  type,
  title,
  summary,
  author,
  category,
}: LibraryItemPreviewProps) => {
  const navigate = useNavigate();
  const config = getTypeConfig(type);
  const Icon = config.icon;

  const handleViewInLibrary = () => {
    navigate(`/library?item=${id}`);
  };

  return (
    <Card className="p-4 bg-card/50 border-border/50 hover:border-border transition-colors my-2">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.className} flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {title}
              </h4>
              {(author || category) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {author && <span>{author}</span>}
                  {author && category && <span> • </span>}
                  {category && <span>{category}</span>}
                </p>
              )}
            </div>
            <Badge variant="outline" className={`${config.className} text-xs flex-shrink-0`}>
              {config.label}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {summary}
          </p>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewInLibrary}
            className="h-8 text-xs -ml-2"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View in Library
          </Button>
        </div>
      </div>
    </Card>
  );
};
