import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./useSession";

export function useIsAdmin() {
  const { user, loading } = useSession();
  const query = useQuery({
    queryKey: ["is-admin", user?.id ?? null],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
  return {
    isAdmin: query.data === true,
    loading: loading || query.isLoading,
  };
}
