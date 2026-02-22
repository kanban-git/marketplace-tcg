import { Search } from "lucide-react";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";

interface Props {
  onSearch: (query: string) => void;
}

const HeroSection = ({ onSearch }: Props) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    onSearch(tag);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative mx-auto px-4 py-20 text-center md:py-28">
        <h1 className="animate-fade-in font-display text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
          Compre e venda{" "}
          <span className="text-gradient-gold">cartas TCG</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl animate-fade-in text-base text-muted-foreground [animation-delay:100ms] md:text-lg">
          Seu hub de cartas colecionáveis. Pokémon, Magic, Yu-Gi-Oh! e muito mais.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-lg animate-fade-in items-center gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-card [animation-delay:200ms]"
        >
          <Search className="ml-4 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cartas, coleções, vendedores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            className="m-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buscar
          </button>
        </form>

        <div className="mt-6 flex animate-fade-in flex-wrap items-center justify-center gap-2 [animation-delay:300ms]">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {["Charizard", "Black Lotus", "Pikachu VMAX", "Exodia"].map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="cursor-pointer rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
