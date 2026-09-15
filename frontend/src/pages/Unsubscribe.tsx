import API_URL from "../config/api";

import { useEffect, useState } from "react";
import SEO from "../components/seo/SEO";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, MailX, Loader2 } from "lucide-react";
import ErrorState from "../components/errors/ErrorState";

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<
    "loading" | "success" | "invalid" | "error"
  >("loading");

  useEffect(() => {
    async function unsubscribe() {
      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/newsletter/unsubscribe/${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = await response.json().catch(() => null);

        if (response.ok && data?.success) {
          setStatus("success");
          return;
        }

        if (response.status === 404) {
          setStatus("invalid");
          return;
        }

        setStatus("error");
      } catch (error) {
        console.error("Unsubscribe error:", error);
        setStatus("error");
      }
    }

    void unsubscribe();
  }, [token]);

  return (
    <>
      <SEO
        title="Unsubscribe — TboyArts"
        description="Manage your TboyArts newsletter subscription."
        noIndex
      />

      <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
          padding: "48px 28px",
        }}
      >
        {status === "loading" && (
          <>
            <Loader2
              size={42}
              strokeWidth={1.5}
              style={{ animation: "spin 1s linear infinite" }}
            />

            <h1>Processing your request</h1>

            <p>
              Please wait while we update your email preferences.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2
              size={56}
              strokeWidth={1.5}
            />

            <h1>You&apos;ve been unsubscribed</h1>

            <p>
              You will no longer receive TboyArts marketing
              emails.
            </p>

            <p>
              Essential transactional emails, such as order
              confirmations, may still be sent when necessary.
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <MailX
              size={56}
              strokeWidth={1.5}
            />

            <h1>Invalid unsubscribe link</h1>

            <p>
              This unsubscribe link is invalid or has already
              expired.
            </p>
          </>
        )}

        {status === "error" && (
          <ErrorState
            type="server"
            title="Unable to Update Subscription"
            message="We could not update your email preferences. Please try again later."
            actionLabel="Try Again"
            onAction={() => window.location.reload()}
          />
        )}

        <Link
          to="/"
          style={{
            display: "inline-block",
            marginTop: "28px",
            padding: "12px 22px",
            textDecoration: "none",
          }}
        >
          Return to TboyArts
        </Link>
      </section>
      </main>
    </>
  );
}
