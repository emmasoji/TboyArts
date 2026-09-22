import { useEffect } from "react";

type SEOProps = {
  title: string;
  description: string;
  noIndex?: boolean;
};

const DEFAULT_TITLE = "TboyArts — Contemporary Art";
const SITE_URL =
  import.meta.env.VITE_SITE_URL || "https://www.tboyarts.shop";

export default function SEO({
  title,
  description,
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;


    const setMeta = (
      selector: string,
      attribute: "name" | "property",
      key: string,
      content: string,
    ) => {
      let element = document.head.querySelector<HTMLMetaElement>(
        `${selector}[${attribute}="${key}"]`,
      );

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    setMeta("meta", "name", "description", description);
    setMeta(
      "meta",
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow",
    );

    setMeta("meta", "property", "og:title", title);
    setMeta("meta", "property", "og:description", description);

    setMeta("meta", "property", "og:type", "website");
    setMeta("meta", "property", "og:url", window.location.href);

    setMeta("meta", "name", "twitter:title", title);
    setMeta(
      "meta",
      "name",
      "twitter:description",
      description,
    );
    setMeta(
      "meta",
      "name",
      "twitter:card",
      "summary_large_image",
    );

    const canonicalUrl = `${SITE_URL}${window.location.pathname}`;

    let canonical =
      document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }

    canonical.href = canonicalUrl;
  }, [title, description, noIndex]);

  return null;
}
