import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request){
    try {
        const {name,email,phone} = await request.json();

        const {data, error} = await supabaseServer
        .from('participants')
        .insert({
            name,
            email : email || null,
            phone
        })
        .select('id,access_token')
        .single();

        if (error){
            console.log('Registration failed : ',error);

            return NextResponse.json(
                {
                    error : error.message
                },
                {status:400}
            );
        }

        const response = NextResponse.json({
            success : true
        })

        response.cookies.set('participant_token',data.access_token,{
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

    } catch (error) {
        console.error('API error :',error);

        return NextResponse.json(
            {
                error: 'Something went wrong'
            },
            {status:500}
        );
        
    }
}