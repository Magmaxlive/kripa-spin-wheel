import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

const RECENT_LIMIT = 5;

export async function GET() {
    try {
        const auth = await requireAdmin();

        if (!auth.ok) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const { supabase } = auth;

        const [
            participantsCount,
            spinsCount,
            prizesWonCount,
            noPrizeCount,
            activeGiftsCount,
            activeGiftsStock,
            recentParticipants,
            recentSpins,
            giftOverview,
        ] = await Promise.all([
            supabase
                .from("participants")
                .select("id", { count: "exact", head: true }),
            supabase
                .from("spins")
                .select("id", { count: "exact", head: true }),
            supabase
                .from("spins")
                .select("id", { count: "exact", head: true })
                .not("gift_id", "is", null),
            supabase
                .from("spins")
                .select("id", { count: "exact", head: true })
                .is("gift_id", null),
            supabase
                .from("gifts")
                .select("id", { count: "exact", head: true })
                .eq("is_active", true),
            supabase
                .from("gifts")
                .select("stock")
                .eq("is_active", true),
            supabase
                .from("participants")
                .select("id, name, email, phone, created_at")
                .order("created_at", { ascending: false })
                .limit(RECENT_LIMIT),
            supabase
                .from("spins")
                .select(
                    "id, created_at, gift_id, gifts(name), participants(name, email)"
                )
                .order("created_at", { ascending: false })
                .limit(RECENT_LIMIT),
            supabase
                .from("gifts")
                .select("id, name, stock, weight, is_active")
                .order("created_at", { ascending: true }),
        ]);

        const errors = [
            participantsCount.error,
            spinsCount.error,
            prizesWonCount.error,
            noPrizeCount.error,
            activeGiftsCount.error,
            activeGiftsStock.error,
            recentParticipants.error,
            recentSpins.error,
            giftOverview.error,
        ].filter(Boolean);

        if (errors.length) {
            console.error("Admin stats query error:", errors);
            return NextResponse.json(
                { error: "Unable to load dashboard statistics." },
                { status: 500 }
            );
        }

        const remainingStock = (activeGiftsStock.data ?? []).reduce(
            (sum, gift) => sum + (gift.stock ?? 0),
            0
        );

        return NextResponse.json({
            stats: {
                totalParticipants: participantsCount.count ?? 0,
                totalSpins: spinsCount.count ?? 0,
                prizesWon: prizesWonCount.count ?? 0,
                noPrizeResults: noPrizeCount.count ?? 0,
                activeGifts: activeGiftsCount.count ?? 0,
                remainingStock,
            },
            recentParticipants: recentParticipants.data ?? [],
            recentSpins: (recentSpins.data ?? []).map((spin) => ({
                id: spin.id,
                created_at: spin.created_at,
                gift_name: spin.gifts?.name ?? null,
                participant_name: spin.participants?.name ?? null,
                participant_email: spin.participants?.email ?? null,
            })),
            gifts: giftOverview.data ?? [],
        });
    } catch (error) {
        console.error("Admin stats API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
