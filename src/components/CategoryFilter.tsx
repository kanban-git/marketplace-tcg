import { useState } from "react";

const categories = [
  { id: "all", label: "Todos", emoji: "🃏" },
  { id: "pokemon", label: "Pokémon", emoji: "⚡" },
  { id: "magic", label: "Magic", emoji: "🔮" },
  { id: "yugioh", label: "Yu-Gi-Oh!", emoji: "👁️" },
  { id: "onepiece", label: "One Piece", emoji: "🏴‍☠️" },
  { id: "digimon", label: "Digimon", emoji: "🦖" },
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: Props) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
            selected === cat.id
              ? "border-primary bg-primary/10 text-primary shadow-glow"
              : "border-border bg-secondary text-secondary-foreground hover:border-primary/30"
          }`}
        >
          <span className="mr-1.5">{cat.emoji}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
