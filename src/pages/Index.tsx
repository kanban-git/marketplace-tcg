import { useState, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import ListingCard from "@/components/ListingCard";
import ListingDetailDialog from "@/components/ListingDetailDialog";
import Footer from "@/components/Footer";
import { mockListings, type Listing } from "@/data/mockListings";

const Index = () => {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const listingsRef = useRef<HTMLDivElement>(null);

  const scrollToListings = () => {
    listingsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategoryFromNav = (cat: string) => {
    setCategory(cat);
    setSearch("");
    scrollToListings();
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setCategory("all");
    scrollToListings();
  };

  const filtered = mockListings.filter((l) => {
    const matchesCategory = category === "all" || l.category === category;
    const matchesSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.game.toLowerCase().includes(search.toLowerCase()) ||
      l.seller.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onCategorySelect={handleCategoryFromNav} />
      <HeroSection onSearch={handleSearch} />

      <main ref={listingsRef} className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {search ? `Resultados para "${search}"` : "Anúncios recentes"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} cartas disponíveis
            </p>
          </div>
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((listing, i) => (
            <div
              key={listing.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ListingCard listing={listing} onClick={() => setSelectedListing(listing)} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              Nenhuma carta encontrada.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory("all"); }}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </main>

      <Footer onCategorySelect={handleCategoryFromNav} />

      <ListingDetailDialog
        listing={selectedListing}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
      />
    </div>
  );
};

export default Index;
