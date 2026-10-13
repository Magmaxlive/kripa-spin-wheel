import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export async function POST() {
    try {
        const supabase = await createAuthServerClient();
        await supabase.auth.signOut();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin logout error:", error);
        return NextResponse.json(
            { error: "Unable to sign out" },
            { status: 500 }
        );
    }
}
