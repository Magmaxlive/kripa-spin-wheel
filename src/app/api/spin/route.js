import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(){
    try {
        // getting participant token from cookie

        const cookieStore = await cookies();
        const token = cookieStore.get('participant_token')?.value;

        if(!token){
            return NextResponse.json(
                {error:'please register before spinning'},
                {status:401}
            );
        }

        // verify participant
        const { data:participant, error:participantError}=
            await supabaseServer
            .from('participant')
            .select('id')
            .eq('access_token',token)
            .single();

        if (participantError || !participant ){
            return NextResponse.json(
                { error:'Participant not found.Please register again.' },
                { status: 401 }
            );
        }

        // check whether participant already spun
        const { data: existingSpin , error: spinCheckError } =
            await supabaseServer
            .from('spins')
            .select('id,gift_id')
            .eq('participant_id',participant.id)
            .maybeSingle();

        if (spinCheckError){
            console.error('Spin check error:',spinCheckError);

            return NextResponse.json(
                { error: 'Unable to check your spin status.'},
                { status: 500 }
            );
        }

        if (existingSpin){
            return NextResponse.json(
                {
                    error:'You have already used your spin',
                    alreadySpun : true,
                },
                { status:409 }
            );
        }

    } catch (error) {
        
    }
}