import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourStep {
  title: string;
  description: string;
  route: string;
  action?: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to the Studio!",
    description: "Start by reading through some stories, gathering inspiration for what might unfold in your community.",
    route: "/",
    target: "[data-tour='stories-section']",
    position: "bottom",
  },
  {
    title: "Explore the Prompt Pond",
    description: "Read through the remixable prompts to see what's possible.",
    route: "/prompt-pond",
    target: "[data-tour='prompts-grid']",
    position: "top",
  },
  {
    title: "Look at Examples",
    description: "Each prompt has examples showing how it can be used in different contexts.",
    route: "/prompt-pond",
    action: "Click 'Example' on any prompt card to see real examples.",
    target: "[data-tour='prompt-card']",
    position: "right",
  },
  {
    title: "Pick One to Remix!",
    description: "When you find a prompt that resonates, click 'Remix' to start customizing it for your community.",
    route: "/prompt-pond",
    action: "Try clicking 'Remix' on a prompt that interests you.",
    target: "[data-tour='prompt-card']",
    position: "right",
  },
  {
    title: "Chat with Your Sidekick",
    description: "The relational tech sidekick will ask you questions about your context and vision, helping you craft the perfect prompt.",
    route: "/prompt-pond",
    target: "[data-tour='chat-section']",
    position: "left",
  },
  {
    title: "Copy Your Remixed Prompt",
    description: "Once you have your customized prompt, copy it and bring it into your preferred tool-builder.",
    route: "/prompt-pond",
    target: "[data-tour='chat-section']",
    position: "left",
  },
  {
    title: "Tools for Crafting",
    description: "Review the tools available here. Copy-paste your remixed prompt into a builder like Lovable or Dyad to spin up your hyperlocal tool!",
    route: "/tools",
    target: "[data-tour='tools-grid']",
    position: "top",
  },
  {
    title: "Contribute to the Commons",
    description: "Come back to share your story, the prompt you used, and the tools that helped you craft your relational tech.",
    route: "/",
    action: "Share your journey to inspire others!",
    target: "[data-tour='contribute-button']",
    position: "bottom",
  },
];

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  getTotalSteps: () => number;
  getCurrentStepData: () => TourStep | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      // Auto-start tour on first visit after a brief delay
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      const currentStepData = tourSteps[currentStep];
      if (currentStepData && location.pathname !== currentStepData.route) {
        navigate(currentStepData.route);
      }
    }
  }, [currentStep, isActive, navigate, location]);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    navigate(tourSteps[0].route);
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('hasSeenTour', 'true');
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTotalSteps = () => tourSteps.length;

  const getCurrentStepData = () => {
    return tourSteps[currentStep] || null;
  };

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        startTour,
        endTour,
        nextStep,
        previousStep,
        getTotalSteps,
        getCurrentStepData,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
