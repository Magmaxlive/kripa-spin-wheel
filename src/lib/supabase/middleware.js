import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request){
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabse = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_API_KEY,
        {
            cookies:{
                getAll(){
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet){
                    cookiesToSet.forEach(({name,value})=>{
                        request.cookies.set(name,value);
                    });

                supabaseResponse = NextResponse.next({
                    request,
                });

                cookiesToSet.forEach(({name,value,options})=>{
                    supabaseResponse.cookies.set(name,value,options)
                });
                },
            },
        }
    );

    await supabse.auth.getUser();

    return supabaseResponse;
}