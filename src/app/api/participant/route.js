import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('participant_token')?.value;

        if(!token){
            return NextResponse.json(
                { authenticated : false },
                { status : 401 }
            );
        }

        const {data,error} = await supabaseServer
        .from('participants')
        .select('id,name,phone,email')
        .eq('access_token',token)
        .single();

        if (error || !data){
            return NextResponse.json(
                { authenticated : false },
                { status : 401 }
            );
        }

        return NextResponse.json(
            { authenticated : true ,
                participant : data
            });
    } catch (error) {
        console.error("Participant verification error:", error);

        return NextResponse.json(
            { authenticated: false },
            { status: 500 }
        );
    }
}