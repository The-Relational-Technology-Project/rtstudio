import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/TopNav";

/**
 * Shared layout for authenticated app pages. Keeps TopNav mounted across
 * route changes so the main nav doesn't unmount/remount (which caused the
 * "jumpy/flashy" flicker between pages).
 */
export const AppLayout = () => {
  return (
    <>
      <TopNav />
      <Outlet />
    </>
  );
};
