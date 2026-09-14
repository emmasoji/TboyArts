import {
  LayoutDashboard,
  Palette,
  ShoppingBag,
  Users,
  UserRound,
  Home,
  Settings,
  ChevronsLeft,
  Sun,
  Moon,
} from "lucide-react";

import type { AdminSection } from "./AdminLayout";
import { useAdminTheme } from "../../contexts/AdminThemeContext";

interface AdminSidebarProps {
  open: boolean;
  activeSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onClose: () => void;
}

const navigation: {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "artworks", label: "Artworks", icon: Palette },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "artist", label: "Artist", icon: UserRound },
  { id: "homepage", label: "Homepage", icon: Home },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({
  open,
  activeSection,
  onNavigate,
  onClose,
}: AdminSidebarProps) {
  const { theme, toggleTheme } = useAdminTheme();
  const light = theme === "light";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden admin-sidebar-backdrop"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col",
          "border-r",
          "admin-theme-bg admin-theme-text admin-theme-border",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0 admin-sidebar-open" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand */}
        <div
          className={[
            "relative flex h-15 items-center justify-center",
            "border-b admin-theme-border",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className={[
              "absolute right-5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white shadow-lg transition",
              light
                ? "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                : "bg-neutral-900 text-neutral-500 hover:bg-neutral-800 hover:text-white",
            ].join(" ")}
          >
            <ChevronsLeft size={26} strokeWidth={2.2} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1">
            {navigation.map(({ id, label, icon: Icon }, index) => {
              const active = activeSection === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(id)}
                  style={{
                    animationDelay: `${index * 70 + 150}ms`,
                  }}
                  className={[
                    "group flex w-full items-center gap-3",
                    "rounded-lg px-3.5 py-3",
                    "text-left text-sm font-medium",
                    "admin-sidebar-link-open",
                    "transition-colors duration-200",
                    active
                      ? light
                        ? "bg-neutral-950 !text-white hover:!text-white"
                        : "bg-white !text-neutral-950 hover:!text-neutral-950"
                      : [
                          "admin-theme-muted",
                          light
                            ? "!text-neutral-500 hover:!bg-neutral-100 hover:!text-neutral-950"
                            : "!text-neutral-500 hover:!bg-neutral-900 hover:!text-white",
                        ].join(" "),
                  ].join(" ")}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={
                      active
                        ? ""
                        : light
                          ? "text-neutral-400 group-hover:text-neutral-700"
                          : "text-neutral-600 group-hover:text-neutral-300"
                    }
                  />

                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
        {/* Appearance */}
        <div className="border-t admin-theme-border px-3 py-4">
          <div className="flex items-center justify-between rounded-xl px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Appearance
              </p>

              <p className="mt-0.5 text-[11px] admin-theme-muted">
                {light ? "Light mode" : "Dark mode"}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                light
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              title={
                light
                  ? "Dark mode"
                  : "Light mode"
              }
              className={[
                "relative flex h-8 w-14 shrink-0 items-center rounded-full border p-1",
                "transition-colors duration-200",
                light
                  ? "border-neutral-300 bg-neutral-200"
                  : "border-neutral-700 bg-neutral-800",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  "shadow-sm transition-transform duration-200",
                  light
                    ? "translate-x-0 bg-white text-neutral-700"
                    : "translate-x-6 bg-neutral-950 text-white",
                ].join(" ")}
              >
                {light ? (
                  <Sun size={14} strokeWidth={2} />
                ) : (
                  <Moon size={14} strokeWidth={2} />
                )}
              </span>
            </button>
          </div>
        </div>

      </aside>

      <style>{`
        @keyframes adminSidebarOpen {
          0% {
            opacity: 0;
            transform: translateX(-100%);
          }

          70% {
            opacity: 1;
            transform: translateX(8px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes adminSidebarLinkOpen {
          0% {
            opacity: 0;
            transform: translateX(-35px);
          }

          70% {
            opacity: 1;
            transform: translateX(5px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes adminSidebarBackdrop {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .admin-sidebar-open {
          animation: adminSidebarOpen 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .admin-sidebar-link-open {
          animation: adminSidebarLinkOpen 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .admin-sidebar-backdrop {
          animation: adminSidebarBackdrop 400ms ease-out both;
        }
      `}</style>
    </>
  );
}
