import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/home/Hero";
import FeaturedArtwork from "../components/home/FeaturedArtwork";
import BrowseCategories from "../components/home/BrowseCategories";
import NewArrivals from "../components/home/NewArrivals";
import ArtistStory from "../components/home/ArtistStory";
import HomeCTA from "../components/home/HomeCTA";
import SEO from "../components/seo/SEO";
import ErrorState from "../components/errors/ErrorState";

export default function Home() {
  const [pageError, setPageError] = useState<string | null>(null);

  return (
    <>
      <SEO
        title="TboyArts — Contemporary Art"
        description="Explore contemporary artwork created to carry identity, emotion, and story."
      />
      <Navbar />
      <main className="home-page tboyarts-slide-in-left">
        {pageError ? (
          <ErrorState
            type="network"
            fullPage
            title="Unable to Load TboyArts"
            message={
              pageError ||
              "We couldn't load the homepage right now. Please check your internet connection and try again."
            }
            actionLabel="Refresh"
            onAction={() => {
              window.location.reload();
            }}
          />
        ) : (
          <>
            <Hero />

            <FeaturedArtwork
              onError={setPageError}
            />

            <BrowseCategories
              onError={setPageError}
            />

            <NewArrivals
              onError={setPageError}
            />

            <ArtistStory
              onError={setPageError}
            />

            <HomeCTA />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}