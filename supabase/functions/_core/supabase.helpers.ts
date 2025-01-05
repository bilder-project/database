import {
    createClient as createSupabaseClient,
    SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js";
import { UserData } from "./types.ts";

export const createServiceRoleClient = (): SupabaseClient =>
    createSupabaseClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
            global: {
                headers: {
                    "Authorization": `Bearer ${Deno.env.get(
                        "SUPABASE_SERVICE_ROLE_KEY",
                    )!}`,
                },
            },
        },
    );

export const createAuthenticatedClient = (
    authToken: string,
): SupabaseClient =>
    createSupabaseClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
            global: {
                headers: {
                    "Authorization": authToken,
                },
            },
        },
    );

export const createAnonClient = (): SupabaseClient =>
    createSupabaseClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
    );

export const getUser = async (
    supabase: SupabaseClient,
): Promise<{ data: UserData | null; error: Error | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData, error: userDataError } = await supabase
        .from("users_data")
        .select("*")
        .eq("id", user!.id)
        .single();

    if (userDataError) {
        return { data: null, error: userDataError };
    }

    return { data: userData as UserData, error: null };
};
