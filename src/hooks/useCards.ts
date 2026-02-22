import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Card {
  id: string;
  set_id: string | null;
  name: string;
  number: string | null;
  rarity: string | null;
  supertype: string | null;
  types: string[] | null;
  image_small: string | null;
  image_large: string | null;
  created_at: string;
  collection_number: string; // formatted "04/120"
  set_name: string | null;
}

export function useCards(category: string, search: string) {
  return useQuery({
    queryKey: ["cards", category, search],
    queryFn: async () => {
      const client = supabase as any;
      let query = client
        .from("cards")
        .select("*, sets(name, total)")
        .order("name")
        .limit(100);

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (category !== "all") {
        const typeMap: Record<string, string> = {
          pokemon: "Pokémon",
          fire: "Fire",
          water: "Water",
          grass: "Grass",
          electric: "Lightning",
          psychic: "Psychic",
        };
        const type = typeMap[category];
        if (type) {
          query = query.contains("types", [type]);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: any) => {
        const setTotal = row.sets?.total;
        const num = row.number;
        const formatted = num && setTotal
          ? `${num.toString().padStart(2, "0")}/${setTotal}`
          : num || "—";
        return {
          ...row,
          collection_number: formatted,
          set_name: row.sets?.name || null,
          sets: undefined,
        } as Card;
      });
    },
  });
}
