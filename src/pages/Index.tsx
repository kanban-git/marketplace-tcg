import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryFilter from "@/components/CategoryFilter";
import ListingCard from "@/components/ListingCard";
import Footer from "@/components/Footer";
import { mockListings } from "@/data/mockListings";

const Index = () => {
  const [category, setCategory] = useState("all");

  const filtered =
    category === "all"
      ? mockListings
      : mockListings.filter((l) => l.category === category);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <HeroSection />

      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Anúncios recentes
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
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              Nenhuma carta encontrada nesta categoria.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
