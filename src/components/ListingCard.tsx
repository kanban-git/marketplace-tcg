import { MapPin, Star } from "lucide-react";
import type { Listing } from "@/data/mockListings";

interface Props {
  listing: Listing;
  onClick?: () => void;
}

const conditionColor: Record<string, string> = {
  Mint: "text-green-400 bg-green-400/10 border-green-400/20",
  "Near Mint": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Played: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Heavily Played": "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const ListingCard = ({ listing, onClick }: Props) => {
  return (
    <article
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-gradient-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
    >
      {listing.featured && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
          <Star className="h-3 w-3" />
          Destaque
        </div>
      )}

      <div className="aspect-[3/4] overflow-hidden bg-secondary">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {listing.game}
          </span>
          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${conditionColor[listing.condition]}`}>
            {listing.condition}
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {listing.title}
        </h3>

        <p className="mt-2 font-display text-xl font-bold text-primary">
          R$ {listing.price.toLocaleString("pt-BR")}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">{listing.seller}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {listing.collectionNumber
              ? `${listing.location} · ${listing.collectionNumber}`
              : listing.location}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ListingCard;
