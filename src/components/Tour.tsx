import { useTour } from "@/contexts/TourContext";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Tour = () => {
  const { isActive, currentStep, endTour, nextStep, previousStep, getTotalSteps, getCurrentStepData } = useTour();

  if (!isActive) return null;

  const stepData = getCurrentStepData();
  if (!stepData) return null;

  const totalSteps = getTotalSteps();
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in" />
      
      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4 animate-scale-in">
        <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center justify-between">
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
          <div className="px-6 py-8 space-y-4">
            <h2 className="text-2xl font-bold font-fraunces text-foreground">
              {stepData.title}
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed">
              {stepData.description}
            </p>
            {stepData.action && (
              <div className="bg-accent/50 border border-accent-foreground/10 rounded-lg p-4 mt-4">
                <p className="text-sm text-accent-foreground font-medium">
                  💡 {stepData.action}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={previousStep}
              disabled={isFirstStep}
              className={cn(
                "gap-2",
                isFirstStep && "invisible"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentStep 
                      ? "w-8 bg-primary" 
                      : "w-1.5 bg-primary/20"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={isLastStep ? endTour : nextStep}
              className="gap-2"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
