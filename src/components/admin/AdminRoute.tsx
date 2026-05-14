import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useIsAdmin();
  if (loading) return <LoadingSpinner fullPage text="Checking access..." size="lg" />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
};
