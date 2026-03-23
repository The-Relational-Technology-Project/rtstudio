import { useState } from "react";
import DOMPurify from "dompurify";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { ExternalLink, MessageSquare, Sparkles, BookOpen, Bookmark, BookmarkCheck, Pencil, Trash2, Eye, Wrench, Code, Github, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidekick } from "@/contexts/SidekickContext";
import { EditLibraryItemDialog } from "./EditLibraryItemDialog";
import type { LibraryItem, ItemType } from "@/types/library";

interface LibraryCardProps {
  item: LibraryItem;
  isBookmarked?: boolean;
  onToggleBookmark?: (item: LibraryItem) => void;
  isOwned?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const LibraryCard = ({
  item,
  isBookmarked = false,
  onToggleBookmark,
  isOwned = false,
  onEdit,
  onDelete,
}: LibraryCardProps) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBuildItOpen, setIsBuildItOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setMessages } = useSidekick();

  const isToolType = item.type === "tool" || item.type === "tech_for_building";

  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case "story":
        return "bg-primary/10 text-primary border-primary/20";
      case "prompt":
        return "bg-accent/10 text-accent border-accent/20";
      case "tool":
        return "bg-secondary text-secondary-foreground border-border";
      case "tech_for_building":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDiscussInSidekick = () => {
    const contextMessage = item.type === "tool"
      ? `I'd like to remix the "${item.title}" tool for my neighborhood`
      : `I'd like to discuss "${item.title}"`;
    setMessages([{ role: "user", content: contextMessage }]);
    navigate("/");
  };

  return (
    <>
      <Card className="flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
        {item.imageUrl && (
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover object-top" loading="lazy" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={getTypeColor(item.type)}>
                {item.type === "tech_for_building" ? "Tech for Building" : item.type}
              </Badge>
              {item.isJoinable && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                  <Users className="w-2.5 h-2.5 mr-0.5" />
                  join
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onToggleBookmark?.(item)}
              title={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
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
          {isToolType ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(true)}>
                <Eye className="w-3 h-3 mr-1" />
                Try It
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsBuildItOpen(true)}>
                <Wrench className="w-3 h-3 mr-1" />
                Build It
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(true)}>
                <BookOpen className="w-3 h-3 mr-1" />
                View
              </Button>
            </>
          )}
          {isOwned && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{item.title}" from the library. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={onDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Try It / View Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className={getTypeColor(item.type)}>
                  {item.type === "tech_for_building" ? "Tech for Building" : item.type}
                </Badge>
                {item.isJoinable && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    join
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggleBookmark?.(item)}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
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

            {isToolType && (
              <div className="space-y-4">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.title} className="w-full rounded-lg border border-border" />
                )}
                <p className="text-sm leading-relaxed">{item.summary}</p>
                {item.url && (
                  <Button variant="outline" onClick={() => window.open(item.url, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit
                  </Button>
                )}
              </div>
            )}

            {!isToolType && (
              <div className="pt-4 border-t">
                <Button onClick={handleDiscussInSidekick} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discuss in Sidekick
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Build It Dialog — tools only */}
      {isToolType && (
        <Dialog open={isBuildItOpen} onOpenChange={setIsBuildItOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-fraunces">Build "{item.title}"</DialogTitle>
              <p className="text-sm text-muted-foreground">Three ways to get started</p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Prompt on-ramp */}
              <div className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Prompt</h3>
                  <span className="text-xs text-muted-foreground">— The recipe that nearly builds it</span>
                </div>
                {item.childPrompts && item.childPrompts.length > 0 ? (
                  <div className="space-y-2">
                    {item.childPrompts.map((prompt) => (
                      <div key={prompt.id} className="bg-secondary/50 rounded-md p-3">
                        <button
                          className="text-sm font-medium text-left w-full hover:text-primary transition-colors"
                          onClick={() => setExpandedPromptId(expandedPromptId === prompt.id ? null : prompt.id)}
                        >
                          {prompt.title}
                        </button>
                        {expandedPromptId === prompt.id && (
                          <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap border-t border-border pt-2 max-h-60 overflow-y-auto">
                            {prompt.examplePrompt}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No prompt available yet for this tool.</p>
                )}
              </div>

              {/* Remix on-ramp */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Remix</h3>
                  <span className="text-xs text-muted-foreground">— Start a Sidekick chat</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Chat with Sidekick to adapt this tool for your neighborhood.
                </p>
                <Button size="sm" variant="outline" onClick={() => { setIsBuildItOpen(false); handleDiscussInSidekick(); }}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Remix with Sidekick
                </Button>
              </div>

              {/* Source on-ramp */}
              {(item.lovableUrl || item.githubUrl) && (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">Source</h3>
                    <span className="text-xs text-muted-foreground">— See how it's built</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {item.lovableUrl && (
                      <Button size="sm" variant="outline" onClick={() => window.open(item.lovableUrl, "_blank")}>
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View on Lovable
                      </Button>
                    )}
                    {item.githubUrl && (
                      <Button size="sm" variant="outline" onClick={() => window.open(item.githubUrl, "_blank")}>
                        <Github className="w-3 h-3 mr-1" />
                        View on GitHub
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isOwned && (
        <EditLibraryItemDialog
          item={item}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSuccess={() => {
            setIsEditOpen(false);
            onEdit?.();
          }}
        />
      )}
    </>
  );
};
