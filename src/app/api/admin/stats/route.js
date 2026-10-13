
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { supabaseServer } from "@/lib/supabase/server";

const RECENT_LIMIT = 5;

export async function GET() {
    try {
        // Verify the logged-in user is an authorized admin first.
        const auth = await requireAdmin();

        if (!auth.ok) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        // Use the service-role client only on the server,
        // and only after verifying admin authorization.
        const supabase = supabaseServer;

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
            // Total participants
            supabase
                .from("participants")
                .select("id", { count: "exact", head: true }),

            // Total spins
            supabase
                .from("spins")
                .select("id", { count: "exact", head: true }),

            // Spins with a prize
            supabase
                .from("spins")
                .select("id", { count: "exact", head: true })
                .not("gift_id", "is", null),

            // Spins with no prize
            supabase
                .from("spins")
                .select("id", { count: "exact", head: true })
                .is("gift_id", null),

            // Active gifts
            supabase
                .from("gifts")
                .select("id", { count: "exact", head: true })
                .eq("is_active", true),

            // Stock of active gifts
            supabase
                .from("gifts")
                .select("stock")
                .eq("is_active", true),

            // Five most recent participants
            supabase
                .from("participants")
                .select("id, name, email, phone, created_at")
                .order("created_at", { ascending: false })
                .limit(RECENT_LIMIT),

            // Five most recent spins
            supabase
                .from("spins")
                .select(
                    "id, created_at, gift_id, gifts(name), participants(name, email)"
                )
                .order("created_at", { ascending: false })
                .limit(RECENT_LIMIT),

            // Gift overview
            supabase
                .from("gifts")
                .select("id, name, stock, weight, is_active")
                .order("created_at", { ascending: false }),
        ]);

        // Check for database query errors.
        const errors = [
            ["participantsCount", participantsCount],
            ["spinsCount", spinsCount],
            ["prizesWonCount", prizesWonCount],
            ["noPrizeCount", noPrizeCount],
            ["activeGiftsCount", activeGiftsCount],
            ["activeGiftsStock", activeGiftsStock],
            ["recentParticipants", recentParticipants],
            ["recentSpins", recentSpins],
            ["giftOverview", giftOverview],
        ].filter(([, result]) => result.error);

        if (errors.length > 0) {
            console.error(
                "Admin stats query errors:",
                errors.map(([query, result]) => ({
                    query,
                    message: result.error.message,
                    code: result.error.code,
                    details: result.error.details,
                    hint: result.error.hint,
                }))
            );

            return NextResponse.json(
                { error: "Unable to load dashboard statistics." },
                { status: 500 }
            );
        }

        // Calculate total remaining stock for active gifts.
        const remainingStock = (
            activeGiftsStock.data ?? []
        ).reduce(
            (sum, gift) => sum + (gift.stock ?? 0),
            0
        );

        // Return dashboard data.
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
