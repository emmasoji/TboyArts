import { useEffect, useState } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import Dashboard from "./dashboard/Dashboard";
import Artworks from "./artworks/Artworks";
import Orders from "./orders/Orders";
import Customers from "./customers/Customers";
import ArtistManagement from "./artist/ArtistManagement";
import HomepageManagement from "./homepage/HomepageManagement";
import AdminSettings from "./settings/AdminSettings";

import { useAdminTheme } from "../../contexts/AdminThemeContext";

export type AdminSection =
  | "dashboard"
  | "artworks"
  | "orders"
  | "customers"
  | "artist"
  | "homepage"
  | "settings";

export default function AdminLayout() {
  const [section, setSection] = useState<AdminSection>(() => {
    const savedSection = localStorage.getItem("tboyarts-admin-section");

    const validSections: AdminSection[] = [
      "dashboard",
      "artworks",
      "orders",
      "customers",
      "artist",
      "homepage",
      "settings",
    ];

    return savedSection && validSections.includes(savedSection as AdminSection)
      ? (savedSection as AdminSection)
      : "dashboard";
  });

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const { theme } = useAdminTheme();
  const isLight = theme === "light";

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [section]);

  const renderPage = () => {
    switch (section) {
      case "artworks":
        return <Artworks />;
      case "orders":
        return <Orders />;
      case "customers":
        return <Customers />;
      case "artist":
        return <ArtistManagement />;
      case "homepage":
        return <HomepageManagement />;
      case "settings":
        return <AdminSettings />;
      default:
        return <Dashboard onNavigate={setSection} />;
    }
  };

  return (
    <div
      className={[
        "admin-layout",
        "min-h-screen",
        "transition-colors duration-300",
        isLight
          ? "bg-[#e7e5e0] text-neutral-950"
          : "bg-[#0a0a0a] text-white",
      ].join(" ")}
    >
      <AdminSidebar
        open={sidebarOpen}
        activeSection={section}
        onNavigate={(nextSection) => {
          setSection(nextSection);
          localStorage.setItem("tboyarts-admin-section", nextSection);
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        className={[
          "h-screen",
          "min-h-0",
          "min-w-0",
          "w-full",
          "flex-1",
          "flex",
          "flex-col",
          "lg:ml-64",
          "transition-colors duration-300",
          isLight
            ? "bg-[#e7e5e0]"
            : "bg-[#0a0a0a]",
        ].join(" ")}
      >
        <AdminHeader
          section={section}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div
          className={[
            "min-h-0 min-w-0 w-full max-w-full flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 sm:px-8 sm:py-8",
            "transition-colors duration-300",
            isLight
              ? "text-neutral-950"
              : "text-white",
          ].join(" ")}
        >
          <div
            key={section}
            className="tboyarts-slide-in-left"
          >
            {renderPage()}
          </div>
        </div>
      </main>
    </div>
  );
}
