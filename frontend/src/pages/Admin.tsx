import { useEffect, useState } from "react";
import SEO from "../components/seo/SEO";

import AdminLayout from "../components/admin/AdminLayout";
import AdminLogin from "../components/admin/auth/AdminLogin";
import { AdminThemeProvider } from "../contexts/AdminThemeContext";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

export default function Admin() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setAuthenticated(Boolean(data.session));
      setSessionLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setAuthenticated(Boolean(session));
      setSessionLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (sessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-sm text-neutral-500">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <>
      <SEO
        title="Admin — TboyArts"
        description="TboyArts administration."
        noIndex
      />

      <AdminThemeProvider>
      {authenticated ? (
        <div className="tboyarts-slide-in-left">
          <AdminLayout />
        </div>
      ) : (
        <div className="tboyarts-slide-in-left">
          <AdminLogin />
        </div>
      )}
      </AdminThemeProvider>
    </>
  );
}
