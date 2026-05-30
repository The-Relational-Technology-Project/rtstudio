import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Props {
  onStart: () => void;
}

export const FieldNotesWelcome = ({ onStart }: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl text-center">
        <p className="font-fraunces text-2xl md:text-3xl text-foreground leading-relaxed mb-6">
          Places are always alive and changing, and no project or piece of tech is ever
          <span className="italic"> 'done.'</span>
        </p>
        <p className="font-fraunces text-xl md:text-2xl text-foreground/90 leading-relaxed mb-6">
          To make the home of your dreams, it's not always about making progress, but rather, to
          notice movement. To be aware of what's changed:
        </p>
        <ul className="font-fraunces text-xl md:text-2xl text-foreground/90 leading-relaxed mb-8 space-y-1">
          <li>In yourself</li>
          <li>In your neighbors</li>
          <li>In your place</li>
        </ul>
        <p className="font-fraunces text-lg md:text-xl text-foreground/80 leading-relaxed mb-4">
          We invite you to take a moment for neighborhood awareness, and to commit to documenting
          these moments regularly as Field Notes.
        </p>
        <p className="font-fraunces text-lg md:text-xl text-foreground/80 italic leading-relaxed mb-10">
          Are you ready to build relational tech, and then listen &amp; observe to what happens next?
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={onStart} className="px-8 text-base">
            Let's go
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExpanded((v) => !v)}
            className="px-8 text-base"
          >
            I need more info
            <ChevronDown
              className={`h-4 w-4 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        {expanded && (
          <div className="mt-10 text-left bg-card border border-border rounded-2xl p-6 md:p-8 font-fraunces text-foreground/90 leading-relaxed space-y-4">
            <p>
              Field Notes are a quiet practice of paying attention. Not a journal, not a productivity
              log — a place to notice what's shifting around you and to write it down so you can
              feel it later.
            </p>
            <p>
              The tech we build at Relational Tech Studio lives inside our neighborhoods. The block
              changes. A neighbor moves. A small kindness happens. Without a habit of noticing, it
              all blurs together.
            </p>
            <p>
              A Field Note can be a sentence, a sketch, a photograph, a list. There's no right way.
              Save it when you're ready — there's no autosave, because the act of pressing save is
              part of the practice.
            </p>
            <p className="text-muted-foreground italic">
              Documentation is a form of care. For yourself, for your neighbors, for the place that
              holds you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
