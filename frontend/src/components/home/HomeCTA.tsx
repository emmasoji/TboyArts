import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { subscribeToNewsletter } from "../../services/newsletterService";
import { NEWSLETTER_ENABLED } from "../../config/features";

export default function HomeCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!NEWSLETTER_ENABLED) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await subscribeToNewsletter(normalizedEmail);

      setSubmitted(true);
      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription failed:", error);

      const supabaseError = error as {
        code?: string;
        message?: string;
      };

      if (supabaseError.code === "23505") {
        setError("You're already on the TboyArts mailing list.");
      } else {
        setError(
          supabaseError.message ||
            "We couldn't subscribe you right now. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="home-cta">
      <div className="home-cta-inner">
        <p className="home-eyebrow">
          STAY IN THE FRAME
        </p>

        <h2>
          Be the first
          <br />
          to see what
          <br />
          comes <em>next.</em>
        </h2>

        <p className="home-cta-description">
          Join the TboyArts mailing list for new artwork,
          studio updates, collections and stories from the
          creative process.
        </p>

        {NEWSLETTER_ENABLED && (
          <>
            {submitted ? (
              <div className="home-cta-success">
                <span>Thank you for joining TboyArts.</span>
              </div>
            ) : (
              <>
                <form
                  className="home-cta-form"
                  onSubmit={handleSubmit}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Your email address"
                    aria-label="Your email address"
                    required
                    disabled={submitting}
                  />

                  <button
                    type="submit"
                    aria-label="Subscribe"
                    disabled={submitting}
                  >
                    <ArrowRight
                      size={20}
                      className={
                        submitting
                          ? "animate-pulse"
                          : ""
                      }
                    />
                  </button>
                </form>

                {error && (
                  <div
                    className="home-cta-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {NEWSLETTER_ENABLED && (
          <p className="home-cta-note">
            No spam. Only art, stories and new releases.
          </p>
        )}
      </div>
    </section>
  );
}
