import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}

export async function createNotification(params: {
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: string;
}) {
  await (supabase as any).from("notifications").insert({
    user_id: params.user_id,
    title: params.title,
    message: params.message,
    type: params.type,
    entity_type: params.entity_type || null,
    entity_id: params.entity_id || null,
  });
}
