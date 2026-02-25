import { useState, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSearch from "@/components/home/HeroSearch";
import BannerCarousel from "@/components/home/BannerCarousel";
import FeaturedListings from "@/components/home/FeaturedListings";
import CollectionsCarousel from "@/components/home/CollectionsCarousel";
import TrendingCardsRow from "@/components/home/TrendingCardsRow";
import RecentListingsRow from "@/components/home/RecentListingsRow";
import CommunityTabs from "@/components/home/CommunityTabs";
import CardGrid from "@/components/CardGrid";
import { useCards } from "@/hooks/useCards";

const Index = () => {
  const [search, setSearch] = useState("");
  const listingsRef = useRef<HTMLDivElement>(null);

  const scrollToListings = () => {
    listingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    scrollToListings();
  };

  const clearSearch = () => setSearch("");

  const { data: searchResults = [], isLoading } = useCards(search, 60);
  const isSearching = search.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <HeroSearch onSearch={handleSearch} />

      <main ref={listingsRef} className="flex-1">
        {isSearching ? (
          <div className="container mx-auto px-4 py-10">
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Resultados para "{search}"
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchResults.length} cartas encontradas
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-sm text-primary hover:underline"
                >
                  Limpar busca
                </button>
              </div>
              <CardGrid cards={searchResults} isLoading={isLoading} />
              {!isLoading && searchResults.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-lg text-muted-foreground">
                    Nenhuma carta encontrada.
                  </p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-14">
            {/* Banner */}
            <div className="container mx-auto px-4 pt-8">
              <BannerCarousel />
            </div>

            {/* Featured Listings (Marketplace) */}
            <div className="container mx-auto px-4">
              <FeaturedListings />
            </div>

            {/* Collections */}
            <div className="container mx-auto px-4">
              <CollectionsCarousel />
            </div>

            {/* Trending */}
            <div className="container mx-auto px-4">
              <TrendingCardsRow />
            </div>

            {/* Recent Listings */}
            <div className="container mx-auto px-4">
              <RecentListingsRow />
            </div>

            {/* Community */}
            <div className="container mx-auto px-4 pb-10">
              <CommunityTabs />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
