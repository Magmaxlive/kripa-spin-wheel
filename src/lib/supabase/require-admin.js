import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function requireAdmin() {
    const supabase = await createAuthServerClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { ok: false, status: 401, error: "Unauthorized" };
    }

    const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError) {
        console.error("Admin authorization lookup failed:", adminError);
        return {
            ok: false,
            status: 500,
            error: "Unable to verify admin authorization",
        };
    }

    if (!admin) {
        return { ok: false, status: 403, error: "Forbidden" };
    }

    return { ok: true, supabase, user };
}
