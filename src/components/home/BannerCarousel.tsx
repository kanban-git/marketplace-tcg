import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEvent } from "@/lib/analytics";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  cta_url: string | null;
  link_url: string | null;
  media_desktop_url: string;
  media_tablet_url: string | null;
  media_mobile_url: string | null;
  order: number;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: "default-1",
    title: "Anuncie suas cartas",
    subtitle: "Venda suas cartas Pokémon de forma rápida e segura.",
    cta_text: "Criar anúncio",
    cta_url: "/anunciar",
    link_url: null,
    media_desktop_url: "/placeholder.svg",
    media_tablet_url: null,
    media_mobile_url: null,
    order: 90,
  },
  {
    id: "default-2",
    title: "Explore coleções",
    subtitle: "Descubra todas as coleções e encontre as cartas que faltam.",
    cta_text: "Ver coleções",
    cta_url: "/colecoes",
    link_url: null,
    media_desktop_url: "/placeholder.svg",
    media_tablet_url: null,
    media_mobile_url: null,
    order: 91,
  },
  {
    id: "default-3",
    title: "Participe da comunidade",
    subtitle: "Conecte-se com outros colecionadores e jogadores.",
    cta_text: "Ver comunidade",
    cta_url: "/comunidade",
    link_url: null,
    media_desktop_url: "/placeholder.svg",
    media_tablet_url: null,
    media_mobile_url: null,
    order: 92,
  },
];

const BannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();

  const { data: apiBanners = [] } = useQuery({
    queryKey: ["active-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("order", { ascending: true });
      if (error) throw error;
      const now = new Date();
      return (data as Banner[]).filter((b) => {
        if ((b as any).starts_at && new Date((b as any).starts_at) > now) return false;
        if ((b as any).ends_at && new Date((b as any).ends_at) < now) return false;
        return true;
      });
    },
    staleTime: 60_000,
  });

  const banners = useMemo(() => {
    if (apiBanners.length >= 3) return apiBanners;
    if (apiBanners.length === 0) return DEFAULT_BANNERS;
    const needed = 3 - apiBanners.length;
    const existingIds = new Set(apiBanners.map((b) => b.id));
    const fill = DEFAULT_BANNERS.filter((d) => !existingIds.has(d.id)).slice(0, needed);
    return [...apiBanners, ...fill];
  }, [apiBanners]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (current >= banners.length && banners.length > 0) {
      setCurrent(0);
    }
  }, [banners.length, current]);

  const banner = banners[current];

  const getMediaUrl = (b: Banner) => {
    if (isMobile) {
      return b.media_mobile_url || b.media_tablet_url || b.media_desktop_url;
    }
    // Simplified: no tablet detection, use desktop. Tablet gets media_tablet_url via CSS if needed.
    return b.media_desktop_url;
  };

  const hasCta = banner.cta_text && banner.cta_url;
  const isClickable = !hasCta && banner.link_url;

  const handleBannerClick = () => {
    trackEvent("click_banner", { entity_type: "banner", entity_id: banner.id });
  };

  const Wrapper = isClickable ? "a" : "div";
  const wrapperProps = isClickable ? { href: banner.link_url!, className: "block", onClick: handleBannerClick } : {};

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <Wrapper {...wrapperProps}>
        <div className="relative">
          {/* Desktop image */}
          <img
            src={banner.media_desktop_url}
            alt={banner.title ?? "Banner"}
            className="hidden h-[200px] w-full object-cover md:block lg:h-[280px]"
          />
          {/* Tablet image */}
          <img
            src={banner.media_tablet_url || banner.media_desktop_url}
            alt={banner.title ?? "Banner"}
            className="hidden h-[200px] w-full object-cover sm:block md:hidden"
          />
          {/* Mobile image */}
          <img
            src={banner.media_mobile_url || banner.media_tablet_url || banner.media_desktop_url}
            alt={banner.title ?? "Banner"}
            className="block h-[180px] w-full object-cover sm:hidden"
          />

          {/* Overlay with text */}
          {(banner.title || banner.subtitle || hasCta) && (
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/80 via-background/20 to-transparent p-5 md:p-8">
              <div>
                {banner.title && (
                  <h3 className="font-display text-lg font-bold text-foreground md:text-xl">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{banner.subtitle}</p>
                )}
                {hasCta && (
                  <a
                    href={banner.cta_url!}
                    onClick={handleBannerClick}
                    className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {banner.cta_text}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </Wrapper>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 text-foreground/60 hover:bg-background/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 text-foreground/60 hover:bg-background/80"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
