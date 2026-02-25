import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  title: string;
  description: string;
  cta: string;
  href: string;
  gradient: string;
}

const slides: Slide[] = [
  {
    title: "Scarlet & Violet — Destinos de Paldea",
    description: "Confira as cartas da coleção mais recente",
    cta: "Ver coleção",
    href: "#colecoes",
    gradient: "from-purple-900/40 to-secondary/60",
  },
  {
    title: "Anuncie suas cartas",
    description: "Cadastre-se e comece a vender agora mesmo",
    cta: "Criar anúncio",
    href: "/anunciar",
    gradient: "from-primary/20 to-secondary/60",
  },
  {
    title: "Comunidade TCGHub",
    description: "Conecte-se com colecionadores e jogadores",
    cta: "Saiba mais",
    href: "#comunidade",
    gradient: "from-blue-900/40 to-secondary/60",
  },
];

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div
        className={`flex items-center justify-between gap-6 bg-gradient-to-r ${slide.gradient} px-6 py-6 md:px-10 md:py-8 transition-all duration-500`}
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-foreground md:text-xl">
            {slide.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {slide.description}
          </p>
          <a
            href={slide.href}
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {slide.cta}
          </a>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 text-foreground/60 hover:bg-background/80"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % slides.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 text-foreground/60 hover:bg-background/80"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BannerCarousel;
