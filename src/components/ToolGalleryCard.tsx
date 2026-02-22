import { useNavigate } from "react-router-dom";

interface ToolGalleryCardProps {
  name: string;
  summary: string;
  imageUrl: string | null;
}

export const ToolGalleryCard = ({ name, summary, imageUrl }: ToolGalleryCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/auth")}
      className="group text-left bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {imageUrl ? (
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Preview coming soon</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-fraunces font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{summary}</p>
      </div>
    </button>
  );
};
