import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SetsGrid from "@/components/SetsGrid";

const Collections = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="container mx-auto flex-1 px-4 py-10">
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground">
        📦 Todas as Coleções
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Navegue por todas as expansões Pokémon TCG
      </p>
      <SetsGrid />
    </main>
    <Footer />
  </div>
);

export default Collections;
