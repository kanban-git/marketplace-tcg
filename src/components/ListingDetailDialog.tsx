import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/data/mockListings";

interface Props {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
}

const conditionLabel: Record<string, string> = {
  Mint: "Mint (Perfeita)",
  "Near Mint": "Near Mint (Quase Perfeita)",
  Played: "Played (Usada)",
  "Heavily Played": "Heavily Played (Muito Usada)",
};

const ListingDetailDialog = ({ listing, open, onClose }: Props) => {
  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
          <img
            src={listing.image}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
          {listing.featured && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              <Star className="h-3 w-3" />
              Destaque
            </div>
          )}
        </div>

        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-left font-display text-xl font-bold text-foreground">
              {listing.title}
            </DialogTitle>
          </DialogHeader>

          <p className="mt-1 font-display text-2xl font-bold text-primary">
            R$ {listing.price.toLocaleString("pt-BR")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {listing.game}
            </span>
            <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {conditionLabel[listing.condition] ?? listing.condition}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              {listing.seller}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                toast.success("Mensagem enviada!", {
                  description: `Você entrou em contato com ${listing.seller}.`,
                });
                onClose();
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Contatar vendedor
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast("Compra em breve!", {
                  description: "O sistema de compra será lançado em breve.",
                });
              }}
            >
              Comprar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDetailDialog;
