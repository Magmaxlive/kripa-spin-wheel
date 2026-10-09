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
            .from('participants')
            .select('id')
            .eq('access_token',token)
            .single();

        if (participantError || !participant ){
            return NextResponse.json(
                { error:'Participant not found.Please register again.' },
                { status: 401 }
            );
        }

        const { data , error } = await supabaseServer.rpc(
            'perform_spin',
            {p_participant_id: participant.id}
        );

        if (error){
            console.error('Spin RPC error : ',error)
            
            if (error.message.includes('ALREADY_SPUN')){
                return NextResponse.json(
                    {
                        error:'You have already used your spin',
                        alreadySpun : true,
                    },
                    { status:409 }
                )
            }

            if (error.message.includes('NO_GIFTS_AVAILABLE')){
                return NextResponse.json(
                    { error:'Sorry, all gifts are currently unavailable',},
                    { status:409 }
                )
            }

            return NextResponse.json(
                { message:'Unable to complete your spin .Please try again'},
                { status : 500}
            );
        }

       
        return NextResponse.json(data);

    } catch (error) {

        console.error('Spin API error:',error);

        return NextResponse.json(
            { error:'Something went wrong. Please try again'},
            { status: 500}
        )

        
    }
}