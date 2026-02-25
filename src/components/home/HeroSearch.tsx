import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import MiniChipsNav from "./MiniChipsNav";

interface Props {
  onSearch: (query: string) => void;
}

const HeroSearch = ({ onSearch }: Props) => (
  <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/40 to-background">
    <div className="container mx-auto px-4 py-12 md:py-16">
      <MiniChipsNav />

      <h1 className="mt-6 text-center font-display text-3xl font-extrabold leading-tight md:text-4xl lg:text-5xl">
        O marketplace de{" "}
        <span className="text-gradient-gold">cartas Pokémon</span>
      </h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground md:text-base">
        Compre e venda cartas TCG com segurança. Encontre a carta perfeita.
      </p>

      <div className="mx-auto mt-6 max-w-xl">
        <SearchAutocomplete onSearch={onSearch} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="gap-2 font-semibold" asChild>
          <Link to="/anunciar">
            <Plus className="h-4 w-4" />
            Anunciar
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="#ofertas">Ver marketplace</a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="#colecoes">Ver coleções</a>
        </Button>
      </div>
    </div>
  </section>
);

export default HeroSearch;
