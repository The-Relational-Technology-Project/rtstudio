import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const Tour = () => {
  const { isActive, currentStep, endTour, nextStep, previousStep, getTotalSteps, getCurrentStepData } = useTour();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('center');

  useEffect(() => {
    if (!isActive) return;

    const stepData = getCurrentStepData();
    if (!stepData) return;

    const updatePosition = () => {
      if (!stepData.target) {
        // Center position for steps without targets
        setTooltipPosition('center');
        return;
      }

      const targetElement = document.querySelector(stepData.target);
      if (!targetElement) {
        setTooltipPosition('center');
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const cardWidth = isMobile ? window.innerWidth - 32 : 400;
      const cardHeight = 280;
      const spacing = 16;

      let top = 0;
      let left = 0;
      let position = stepData.position || 'bottom';

      // Adjust position for mobile
      if (isMobile) {
        position = 'bottom';
      }

      switch (position) {
        case 'top':
          top = rect.top - cardHeight - spacing;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.left - cardWidth - spacing;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.right + spacing;
          break;
        default:
          top = window.innerHeight / 2 - cardHeight / 2;
          left = window.innerWidth / 2 - cardWidth / 2;
      }

      // Keep within viewport bounds
      top = Math.max(spacing, Math.min(top, window.innerHeight - cardHeight - spacing));
      left = Math.max(spacing, Math.min(left, window.innerWidth - cardWidth - spacing));

      setPosition({ top, left });
      setTooltipPosition(position);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep, getCurrentStepData]);

  if (!isActive) return null;

  const stepData = getCurrentStepData();
  if (!stepData) return null;

  const totalSteps = getTotalSteps();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      {/* Subtle highlight overlay */}
      <div className="fixed inset-0 bg-background/40 z-40 pointer-events-none animate-fade-in" />
      
      {/* Tour Card */}
      <div 
        className="fixed z-50 w-[calc(100vw-2rem)] md:w-[400px] animate-scale-in transition-all duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-2 border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary/15 px-4 py-3 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground font-fraunces">
                Step {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={endTour}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-4 py-5 space-y-3">
            <h2 className="text-xl font-bold font-fraunces text-foreground">
              {stepData.title}
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {stepData.description}
            </p>
            {stepData.action && (
              <div className="bg-accent/30 border border-accent-foreground/10 rounded-lg p-3 mt-3">
                <p className="text-xs text-accent-foreground font-medium">
                  💡 {stepData.action}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              disabled={isFirstStep}
              className={cn(
                "gap-2 text-xs",
                isFirstStep && "invisible"
              )}
            >
              <ArrowLeft className="h-3 w-3" />
              Previous
            </Button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentStep 
                      ? "w-6 bg-primary" 
                      : "w-1.5 bg-primary/20"
                  )}
                />
              ))}
            </div>

            <Button
              size="sm"
              onClick={isLastStep ? endTour : nextStep}
              className="gap-2 text-xs"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ArrowRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
