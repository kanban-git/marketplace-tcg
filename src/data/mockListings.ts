export interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  condition: "Mint" | "Near Mint" | "Played" | "Heavily Played";
  game: string;
  category: string;
  seller: string;
  location: string;
  featured?: boolean;
  collectionNumber?: string;
}

export const mockListings: Listing[] = [
  {
    id: "1",
    title: "Charizard VSTAR Rainbow Rare",
    price: 450,
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=560&fit=crop",
    condition: "Mint",
    game: "Pokémon",
    category: "pokemon",
    seller: "CardMaster_BR",
    location: "São Paulo, SP",
    featured: true,
  },
  {
    id: "2",
    title: "Black Lotus Beta Edition",
    price: 85000,
    image: "https://images.unsplash.com/photo-1642056446264-c3c3debc247e?w=400&h=560&fit=crop",
    condition: "Played",
    game: "Magic: The Gathering",
    category: "magic",
    seller: "VintageCollector",
    location: "Rio de Janeiro, RJ",
    featured: true,
  },
  {
    id: "3",
    title: "Pikachu VMAX Secret Rare",
    price: 320,
    image: "https://images.unsplash.com/photo-1627856014754-2907e2355be6?w=400&h=560&fit=crop",
    condition: "Near Mint",
    game: "Pokémon",
    category: "pokemon",
    seller: "PikaFan99",
    location: "Curitiba, PR",
  },
  {
    id: "4",
    title: "Exodia the Forbidden One (Completo)",
    price: 1200,
    image: "https://images.unsplash.com/photo-1606503153255-59d5e417c4ed?w=400&h=560&fit=crop",
    condition: "Near Mint",
    game: "Yu-Gi-Oh!",
    category: "yugioh",
    seller: "DuelistKing",
    location: "Belo Horizonte, MG",
    featured: true,
  },
  {
    id: "5",
    title: "Liliana of the Veil (Foil)",
    price: 280,
    image: "https://images.unsplash.com/photo-1642056446264-c3c3debc247e?w=400&h=560&fit=crop",
    condition: "Mint",
    game: "Magic: The Gathering",
    category: "magic",
    seller: "MTG_Pro",
    location: "Porto Alegre, RS",
  },
  {
    id: "6",
    title: "Mewtwo GX Full Art",
    price: 180,
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=560&fit=crop",
    condition: "Near Mint",
    game: "Pokémon",
    category: "pokemon",
    seller: "PokéTrader",
    location: "Brasília, DF",
  },
  {
    id: "7",
    title: "Blue-Eyes White Dragon 1st Ed",
    price: 3500,
    image: "https://images.unsplash.com/photo-1606503153255-59d5e417c4ed?w=400&h=560&fit=crop",
    condition: "Played",
    game: "Yu-Gi-Oh!",
    category: "yugioh",
    seller: "RetroCards",
    location: "Salvador, BA",
  },
  {
    id: "8",
    title: "Monkey D. Luffy Leader Card",
    price: 95,
    image: "https://images.unsplash.com/photo-1627856014754-2907e2355be6?w=400&h=560&fit=crop",
    condition: "Mint",
    game: "One Piece",
    category: "onepiece",
    seller: "OnePieceFan",
    location: "Recife, PE",
  },
];
