import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
    try {
        const auth = await requireAdmin();

        if (!auth.ok){
            return NextResponse.json(
                {error:auth.error},
                {status:auth.status}
            );
        }

        const {data:gifts,error} = await supabaseServer
        .from('gifts')
        .select('id,name,stock,weight,is_active,created_at')
        .order('created_at',{ascending:false});

        if(error){
            console.error('fetch gifts error :',gifts)

            return NextResponse.json(
                {error:'unable to fetch gifts'},
                {status:500}
            )
        }

        return NextResponse.json({gifts})
    } catch (error) {
        console.error('Admin gifts API error:',error)

        return NextResponse.json(
            {error:'Internal server error,'},
            {status:500}
        )
    }
}


export async function POST(request){
    try {
        const auth = await requireAdmin();

        if (!auth.ok){
            return NextResponse.json(
                {error:auth.error},
                {status:auth.status}
            );
        }

        const body = await request.json
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const stock = request.body.stock;
        const weight = request.body.weight;
    } catch (error) {
        
    }
}