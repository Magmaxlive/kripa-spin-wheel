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

    } catch (error) {
        
    }
}