import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Image, Upload } from "lucide-react";

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
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

type BannerForm = {
  title: string;
  subtitle: string;
  cta_text: string;
  cta_url: string;
  link_url: string;
  media_desktop_url: string;
  media_tablet_url: string;
  media_mobile_url: string;
  order: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

const emptyForm: BannerForm = {
  title: "",
  subtitle: "",
  cta_text: "",
  cta_url: "",
  link_url: "",
  media_desktop_url: "",
  media_tablet_url: "",
  media_mobile_url: "",
  order: 0,
  is_active: true,
  starts_at: "",
  ends_at: "",
};

const SUPABASE_URL = "https://flskgtwqbbwcrlxfaujk.supabase.co";

const AdminBanners = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      // Admin policy allows full SELECT via "Admins can manage banners"
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
  });

  const uploadFile = async (file: File, slot: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${slot}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return `${SUPABASE_URL}/storage/v1/object/public/banners/${path}`;
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: "desktop" | "tablet" | "mobile"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((u) => ({ ...u, [slot]: true }));
    try {
      const url = await uploadFile(file, slot);
      const key =
        slot === "desktop"
          ? "media_desktop_url"
          : slot === "tablet"
          ? "media_tablet_url"
          : "media_mobile_url";
      setForm((f) => ({ ...f, [key]: url }));
      toast.success(`Imagem ${slot} enviada`);
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: BannerForm) => {
      const payload = {
        title: data.title || null,
        subtitle: data.subtitle || null,
        cta_text: data.cta_text || null,
        cta_url: data.cta_url || null,
        link_url: data.link_url || null,
        media_desktop_url: data.media_desktop_url,
        media_tablet_url: data.media_tablet_url || null,
        media_mobile_url: data.media_mobile_url || null,
        order: data.order,
        is_active: data.is_active,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      };
      if (editingId) {
        const { error } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success(editingId ? "Banner atualizado" : "Banner criado");
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["active-banners"] });
      toast.success("Banner excluído");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      cta_text: b.cta_text ?? "",
      cta_url: b.cta_url ?? "",
      link_url: b.link_url ?? "",
      media_desktop_url: b.media_desktop_url,
      media_tablet_url: b.media_tablet_url ?? "",
      media_mobile_url: b.media_mobile_url ?? "",
      order: b.order,
      is_active: b.is_active,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "",
      ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setForm((f) => ({ ...f, order: banners.length }));
    setDialogOpen(true);
  };

  const statusLabel = (b: Banner) => {
    if (!b.is_active) return "Inativo";
    const now = new Date();
    if (b.starts_at && new Date(b.starts_at) > now) return "Agendado";
    if (b.ends_at && new Date(b.ends_at) < now) return "Expirado";
    return "Ativo";
  };

  const statusColor = (b: Banner) => {
    const s = statusLabel(b);
    if (s === "Ativo") return "text-emerald-400";
    if (s === "Agendado") return "text-primary";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Banners</h1>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse bg-card">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Image className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum banner cadastrado</p>
            <Button onClick={openCreate} variant="outline" size="sm">
              Criar primeiro banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <Card key={b.id} className="bg-card">
              <CardContent className="flex items-center gap-4 py-4">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                  <img
                    src={b.media_desktop_url}
                    alt={b.title ?? "Banner"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {b.title || "(Sem título)"}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={statusColor(b)}>{statusLabel(b)}</span>
                    <span className="text-muted-foreground">· Ordem: {b.order}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Excluir banner?")) deleteMutation.mutate(b.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetForm(); setDialogOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Banner" : "Novo Banner"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.media_desktop_url) {
                toast.error("Imagem desktop é obrigatória");
                return;
              }
              saveMutation.mutate(form);
            }}
            className="space-y-4"
          >
            {/* Texts */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Nova coleção" />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              </div>
            </div>

            {/* CTA */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Texto do CTA</Label>
                <Input value={form.cta_text} onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))} placeholder="Ver coleção" />
              </div>
              <div>
                <Label>URL do CTA</Label>
                <Input value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} placeholder="/colecoes/xyz" />
              </div>
            </div>

            <div>
              <Label>Link do banner inteiro (se não tiver CTA)</Label>
              <Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
            </div>

            {/* Media Uploads */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Mídias</p>
              {(
                [
                  { slot: "desktop" as const, label: "Desktop", hint: "1200×320 · Obrigatória", key: "media_desktop_url" as const },
                  { slot: "tablet" as const, label: "Tablet", hint: "1024×320 · Fallback: desktop", key: "media_tablet_url" as const },
                  { slot: "mobile" as const, label: "Mobile", hint: "800×420 · Fallback: tablet/desktop", key: "media_mobile_url" as const },
                ] as const
              ).map(({ slot, label, hint, key }) => (
                <div key={slot} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/webp,image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => handleUpload(e, slot)}
                      />
                      <Button type="button" variant="outline" size="sm" className="gap-1.5 pointer-events-none" disabled={uploading[slot]}>
                        <Upload className="h-3.5 w-3.5" />
                        {uploading[slot] ? "Enviando…" : "Upload"}
                      </Button>
                    </label>
                  </div>
                  {form[key] && (
                    <div className="mt-2 overflow-hidden rounded border border-border">
                      <img src={form[key]} alt={label} className="h-20 w-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Scheduling */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Início (opcional)</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
              </div>
              <div>
                <Label>Fim (opcional)</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} />
              </div>
            </div>

            {/* Order + Active */}
            <div className="flex items-center gap-6">
              <div className="w-24">
                <Label>Ordem</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando…" : editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
