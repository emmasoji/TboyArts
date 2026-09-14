import { useNavigate } from "react-router-dom";
import ErrorState from "../components/errors/ErrorState";
import SEO from "../components/seo/SEO";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Page Not Found — TboyArts"
        description="The requested TboyArts page could not be found."
        noIndex
      />

      <ErrorState
        type="not-found"
        fullPage
        actionLabel="Go Home"
        onAction={() => navigate("/")}
        secondaryActionLabel="Back"
        onSecondaryAction={() => navigate(-1)}
      />
    </>
  );
}
