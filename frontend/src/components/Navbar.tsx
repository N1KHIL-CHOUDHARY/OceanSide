import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { apiFetch } from "@/lib/api";

export function Navbar() {
  const navigate = useNavigate();
  const { user, accessToken, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();

  const onLogout = async () => {
    if (accessToken) {
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          accessToken,
        });
      } catch {
        /* still clear client */
      }
    }
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <Waves className="h-6 w-6 text-[var(--primary)]" aria-hidden />
            OceanSide
          </motion.span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Rooms</Link>
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Create account</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
