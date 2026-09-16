import {
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import type { AdminSection } from "./AdminLayout";
import { useAdminTheme } from "../../contexts/AdminThemeContext";
import { supabase } from "../../lib/supabase";

interface AdminHeaderProps {
  section: AdminSection;
  onMenuClick: () => void;
}


export default function AdminHeader({
  onMenuClick,
}: AdminHeaderProps) {
  const { theme } = useAdminTheme();
  const isLight = theme === "light";

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      window.location.href = "/admin";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={[
        "sticky top-0 z-40",
        "border-b",
        "px-5 py-5 sm:px-8 sm:py-6",
        "backdrop-blur-xl",
        "transition-colors duration-300",

        isLight
          ? "border-neutral-200/80 bg-[#f6f5f2]/90"
          : "border-white/[0.08] bg-[#111113]/90",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={onMenuClick}
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center",
              "rounded-xl border",
              "transition-all duration-200",
              "lg:hidden",

              isLight
                ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                : "border-white/[0.08] bg-white/[0.05] text-white hover:bg-white/[0.1]",
            ].join(" ")}
            aria-label="Open admin menu"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <p
              className={[
                "mb-1 text-x3 font-semibold uppercase tracking-[0.25em]",
                isLight
                  ? "text-neutral-400"
                  : "text-white/30",
              ].join(" ")}
            >
              TboyArts Admin
            </p>
          </div>
        </div>

        {/* Right */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center",
            "rounded-xl border",
            "transition-all duration-200",
            "disabled:cursor-wait disabled:opacity-60",

            isLight
              ? "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              : "border-white/[0.08] bg-white/[0.05] text-white/55 hover:bg-white/[0.1] hover:text-white",
          ].join(" ")}
          aria-label={loggingOut ? "Signing out" : "Sign out"}
          title={loggingOut ? "Signing out..." : "Sign out"}
        >
          <LogOut size={19} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
