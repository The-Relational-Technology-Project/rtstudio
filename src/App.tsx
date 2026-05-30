import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ChangePassword from "./pages/ChangePassword";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import FieldNotes from "./pages/FieldNotes";
import PrototypeShare from "./pages/PrototypeShare";
import PrototypeEmbed from "./pages/PrototypeEmbed";
import BuildPlanShare from "./pages/BuildPlanShare";
import Admin from "./pages/Admin";
import { AdminRoute } from "./components/admin/AdminRoute";
import { TourProvider } from "./contexts/TourContext";
import { SidekickProvider } from "./contexts/SidekickContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Tour } from "./components/Tour";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidekickProvider>
            <TourProvider>
              <Tour />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route path="/sidekick" element={<Navigate to="/home" replace />} />
                <Route
                  path="/library"
                  element={
                    <ProtectedRoute>
                      <Library />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support"
                  element={
                    <ProtectedRoute>
                      <Support />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/field-notes"
                  element={
                    <ProtectedRoute>
                      <FieldNotes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <Admin />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/p/:shareId" element={<PrototypeShare />} />
                <Route path="/p/:shareId/embed" element={<PrototypeEmbed />} />
                <Route path="/plan/:shareId" element={<BuildPlanShare />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TourProvider>
          </SidekickProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
