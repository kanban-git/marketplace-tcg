import { useState, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SetsGrid from "@/components/SetsGrid";
import TrendingCards from "@/components/TrendingCards";
import CardGrid from "@/components/CardGrid";
import Footer from "@/components/Footer";
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
      <HeroSection onSearch={handleSearch} />

      <main ref={listingsRef} className="container mx-auto flex-1 px-4 py-10">
        {isSearching ? (
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
        ) : (
          <>
            {/* Section 1: Trending Cards */}
            <section className="mb-14">
              <h2 className="mb-1 font-display text-2xl font-bold text-foreground">
                🔥 Cartas em Alta
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Cartas com ofertas ativas no marketplace
              </p>
              <TrendingCards />
            </section>

            {/* Section 2: Explore Collections */}
            <section>
              <h2 className="mb-1 font-display text-2xl font-bold text-foreground">
                📦 Explorar por Coleções
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Navegue pelas expansões de Pokémon TCG
              </p>
              <SetsGrid />
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
