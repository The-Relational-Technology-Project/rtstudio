import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { 
  ImagePlus, 
  Trash2, 
  Download, 
  Loader2, 
  Pencil
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface VisionBoardPin {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  position_x: number | null;
  position_y: number | null;
  created_at: string | null;
}

export const VisionBoard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pins, setPins] = useState<VisionBoardPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingPin, setEditingPin] = useState<VisionBoardPin | null>(null);
  const [captionInput, setCaptionInput] = useState("");

  // Fetch pins on mount
  useEffect(() => {
    if (user) {
      fetchPins();
    }
  }, [user]);

  const fetchPins = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("vision_board_pins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching pins:", error);
      toast({
        title: "Error loading vision board",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPins(data || []);
    }
    setIsLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("vision-boards")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get signed URL (bucket is private)
      const { data: urlData } = await supabase.storage
        .from("vision-boards")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      if (!urlData?.signedUrl) throw new Error("Failed to get signed URL");

      // Insert pin record
      const { data: pinData, error: pinError } = await supabase
        .from("vision_board_pins")
        .insert({
          user_id: user.id,
          image_url: filePath, // Store path, not URL
        })
        .select()
        .single();

      if (pinError) throw pinError;

      setPins([...pins, { ...pinData, image_url: urlData.signedUrl }]);
      
      toast({
        title: "Image added",
        description: "Your vision board image has been uploaded",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (pin: VisionBoardPin) => {
    if (!user) return;

    try {
      // Extract file path from the pin
      // The image_url stores the file path when it's not a signed URL
      let filePath = pin.image_url;
      
      // If it's a signed URL, extract the path
      if (pin.image_url.includes("vision-boards")) {
        const match = pin.image_url.match(/vision-boards\/([^?]+)/);
        if (match) {
          filePath = match[1];
        }
      }

      // Delete from storage
      await supabase.storage
        .from("vision-boards")
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from("vision_board_pins")
        .delete()
        .eq("id", pin.id);

      if (error) throw error;

      setPins(pins.filter((p) => p.id !== pin.id));
      
      toast({
        title: "Image removed",
        description: "The image has been deleted from your vision board",
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCaption = (pin: VisionBoardPin) => {
    setEditingPin(pin);
    setCaptionInput(pin.caption || "");
  };

  const handleSaveCaption = async () => {
    if (!editingPin) return;

    try {
      const { error } = await supabase
        .from("vision_board_pins")
        .update({ caption: captionInput.trim() || null })
        .eq("id", editingPin.id);

      if (error) throw error;

      setPins(pins.map((p) => 
        p.id === editingPin.id 
          ? { ...p, caption: captionInput.trim() || null } 
          : p
      ));
      
      setEditingPin(null);
      setCaptionInput("");
      
      toast({
        title: "Caption updated",
        description: "Your image caption has been saved",
      });
    } catch (error: any) {
      console.error("Caption update error:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!boardRef.current || pins.length === 0) return;

    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(boardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add title
      const title = `${profile?.display_name || "My"}'s Vision Board`;
      pdf.setFontSize(24);
      pdf.text(title, 20, 20);

      // Add the vision board image
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 20, 30, imgWidth, Math.min(imgHeight, pageHeight - 50));

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(128);
      pdf.text("Created with Studio", 20, pageHeight - 10);

      pdf.save("vision-board.pdf");

      toast({
        title: "PDF exported",
        description: "Your vision board has been downloaded",
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Generate signed URLs for display
  const [displayPins, setDisplayPins] = useState<VisionBoardPin[]>([]);

  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!user || pins.length === 0) {
        setDisplayPins([]);
        return;
      }

      const pinsWithUrls = await Promise.all(
        pins.map(async (pin) => {
          // If already a signed URL, use as-is
          if (pin.image_url.startsWith("http")) {
            return pin;
          }
          
          // Generate signed URL
          const { data } = await supabase.storage
            .from("vision-boards")
            .createSignedUrl(pin.image_url, 60 * 60); // 1 hour
          
          return {
            ...pin,
            image_url: data?.signedUrl || pin.image_url,
          };
        })
      );

      setDisplayPins(pinsWithUrls);
    };

    generateSignedUrls();
  }, [pins, user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Vision Board</h2>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || pins.length >= 10}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-2" />
            )}
            Add Image
          </Button>
          {displayPins.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Vision board grid */}
      {displayPins.length === 0 ? (
        <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
          <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Your vision board is empty
          </p>
          <p className="text-sm text-muted-foreground">
            Upload images that inspire your neighborhood dreams
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Add Your First Image
          </Button>
        </div>
      ) : (
        <div
          ref={boardRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-background rounded-lg"
        >
          {displayPins.map((pin) => (
            <Card key={pin.id} className="group relative overflow-hidden">
              <AspectRatio ratio={4 / 3}>
                <img
                  src={pin.image_url}
                  alt={pin.caption || "Vision board image"}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </AspectRatio>
              
              {/* Caption overlay */}
              {pin.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm">{pin.caption}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => handleEditCaption(pin)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => handleDelete(pin)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Limit indicator */}
      {pins.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {pins.length}/10 images
        </p>
      )}

      {/* Caption edit dialog */}
      <Dialog open={!!editingPin} onOpenChange={() => setEditingPin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
          </DialogHeader>
          <Input
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            placeholder="Add a caption to this image..."
            maxLength={200}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPin(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCaption}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
