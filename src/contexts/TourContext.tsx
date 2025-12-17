import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
    title: "Welcome to Relational Tech Studio!",
    description: "Meet your Sidekick — an AI assistant that helps you discover relational tech and craft tools for your community.",
    route: "/",
    target: "[data-tour='chat-input']",
    position: "top",
  },
  {
    title: "Explore the Library",
    description: "Browse stories from other neighborhoods, remixable prompts, and recommended tools — all in one place.",
    route: "/library",
    target: "[data-tour='library-grid']",
    position: "top",
  },
  {
    title: "Filter & Search",
    description: "Use filters to find stories, prompts, or tools. Search for specific topics or themes.",
    route: "/library",
    target: "[data-tour='library-filters']",
    position: "bottom",
  },
  {
    title: "Dive Deeper",
    description: "Click any item to see the full details. Use 'Discuss in Sidekick' to explore it further with the AI.",
    route: "/library",
    action: "Try clicking on a story or prompt to see more.",
    target: "[data-tour='library-card']",
    position: "right",
  },
  {
    title: "Remix a Prompt",
    description: "Ask Sidekick to remix any prompt for your neighborhood context. Just describe your community and goals.",
    route: "/",
    target: "[data-tour='quick-actions']",
    position: "top",
  },
  {
    title: "Contribute to the Commons",
    description: "Share your own stories, prompts, or tool recommendations just by chatting. Sidekick will help format and add them to the library.",
    route: "/",
    action: "Try saying 'We did something cool in our neighborhood...'",
    target: "[data-tour='chat-input']",
    position: "top",
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
    const checkAuthAndStartTour = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      
      // Only auto-start tour if user is authenticated and hasn't seen it
      if (session && !hasSeenTour) {
        const timer = setTimeout(() => {
          setIsActive(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    };
    
    checkAuthAndStartTour();
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
