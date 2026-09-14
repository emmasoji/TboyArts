import { supabase } from "../lib/supabase";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  active: boolean;
  unsubscribe_token: string;
}

export interface WelcomeNewsletter {
  id: string;
  subject: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
}

/*
 * GET ALL NEWSLETTER SUBSCRIBERS
 */
export async function getNewsletterSubscribers(): Promise<
  NewsletterSubscriber[]
> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "GET NEWSLETTER SUBSCRIBERS ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to load newsletter subscribers.",
    );
  }

  return (data ?? []) as NewsletterSubscriber[];
}

/*
 * DELETE NEWSLETTER SUBSCRIBER
 */
export async function deleteNewsletterSubscriber(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "DELETE NEWSLETTER SUBSCRIBER ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to delete newsletter subscriber.",
    );
  }
}

/*
 * GET WELCOME NEWSLETTER
 *
 * The welcome newsletter is stored
 * inside the single home_settings row.
 */
export async function getWelcomeNewsletter(): Promise<
  WelcomeNewsletter
> {
  const { data, error } = await supabase
    .from("home_settings")
    .select(`
      id,
      newsletter_email_subject,
      newsletter_email_body,
      newsletter_email_button_text,
      newsletter_email_button_url
    `)
    .limit(1)
    .single();

  if (error) {
    console.error(
      "GET WELCOME NEWSLETTER ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to load welcome newsletter.",
    );
  }

  return {
    id: data.id,
    subject:
      data.newsletter_email_subject ?? "",
    message:
      data.newsletter_email_body ?? "",
    buttonText:
      data.newsletter_email_button_text ?? "",
    buttonUrl:
      data.newsletter_email_button_url ?? "",
  };
}

/*
 * UPDATE WELCOME NEWSLETTER
 */
export async function updateWelcomeNewsletter(
  id: string,
  newsletter: {
    subject: string;
    message: string;
    buttonText: string;
    buttonUrl: string;
  },
): Promise<WelcomeNewsletter> {
  const { data, error } = await supabase
    .from("home_settings")
    .update({
      newsletter_email_subject:
        newsletter.subject,
      newsletter_email_body:
        newsletter.message,
      newsletter_email_button_text:
        newsletter.buttonText,
      newsletter_email_button_url:
        newsletter.buttonUrl,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      id,
      newsletter_email_subject,
      newsletter_email_body,
      newsletter_email_button_text,
      newsletter_email_button_url
    `)
    .single();

  if (error) {
    console.error(
      "UPDATE WELCOME NEWSLETTER ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to save welcome newsletter.",
    );
  }

  return {
    id: data.id,
    subject:
      data.newsletter_email_subject ?? "",
    message:
      data.newsletter_email_body ?? "",
    buttonText:
      data.newsletter_email_button_text ?? "",
    buttonUrl:
      data.newsletter_email_button_url ?? "",
  };
}

/*
 * GET ACTIVE NEWSLETTER SUBSCRIBER COUNT
 *
 * Used before sending an update newsletter so the admin
 * can confirm exactly how many active subscribers will
 * receive the email.
 */
export async function getActiveNewsletterSubscriberCount(): Promise<number> {
  const { count, error } = await supabase
    .from("newsletter_subscribers")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("active", true);

  if (error) {
    console.error(
      "GET ACTIVE NEWSLETTER SUBSCRIBER COUNT ERROR:",
      error,
    );

    throw new Error(
      error.message ||
        "Failed to get active newsletter subscriber count.",
    );
  }

  return count ?? 0;
}


export async function subscribeToNewsletter(
  email: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || normalizedEmail.length <= 3) {
    throw new Error("Please enter a valid email address.");
  }

  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  const response = await fetch(
    `${apiBaseUrl}/api/newsletter/subscribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
      }),
    },
  );

  let data: {
    success?: boolean;
    message?: string;
    detail?: string;
    already_subscribed?: boolean;
  } = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "We couldn't subscribe you right now. Please try again.",
    );
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "We couldn't subscribe you right now. Please try again.",
    );
  }

  if (data.already_subscribed) {
    const error = new Error(
      "You're already on the TboyArts mailing list.",
    ) as Error & { code?: string };

    error.code = "23505";

    throw error;
  }
}
