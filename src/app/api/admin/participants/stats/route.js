import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET(){
    try {
        const auth = await requireAdmin();

        if (!auth.ok){
            return NextResponse.json(
                {error:auth.error},
                {status:auth.status}
            )
        }

        const [
            { count : totalParticipants,error:participantsError},
            { count: spunParticipants,error:spinsError}
            ]  = await Promise.all([
                supabaseServer
                .from('participants')
                .select('id',{count:'exact',head:true}),

                supabaseServer
                .from('spins')
                .select('id',{count:'exact',head:true})
            ]);

            if(participantsError || spinsError){
                console.error('Participant stats error : ',
                    {participantsError,spinsError}
                )

                return NextResponse.json(
                    {error : 'Unable to load participant statistics'},
                    {status:500}
                )
            }

            const total = totalParticipants ?? 0;
            const spun = spunParticipants ?? 0;

            return NextResponse.json(
                {
                    totalParticipants:total,
                    spunParticipants:spun,
                    notSpunParticipants:Math.max(0,total-spun)
                });

    } catch (error) {
        console.error("Participant stats API error:", error);

    return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
    );
    }
}