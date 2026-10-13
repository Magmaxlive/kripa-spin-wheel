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

        const body = await request.json();
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const stock = body.stock;
        const weight = body.weight;
        const is_active = body.is_active ?? true;

        if (!name){
            return NextResponse.json(
                {error : 'Gift name is required'},
                {status:400}
            )
        }

        if (
            stock === undefined ||
            stock === null ||
            !Number.isInteger(stock) ||
            stock < 0
        ){
            return NextResponse.json(
                {error:'Stock must be a non-negative integer'},
                {status:400}
            )
        }

         if (
            weight === undefined ||
            weight === null ||
            !Number.isInteger(weight) ||
            weight < 0
        ){
            return NextResponse.json(
                {error:'Weight must be a non-negative integer'},
                {status:400}
            )
        }

        if (typeof is_active !== "boolean") {
            return NextResponse.json(
                { error: "Active status must be true or false." },
                { status: 400 }
            );
        }

        const {data:gift,error} = await supabaseServer
        .from('gifts') 
        .insert({
            name,weight,stock,is_active
        })
        .select('id,name,stock,weight,is_active,created_at')
        .single();

        if (error){
            console.error('Gift creation error :',error)
            return NextResponse.json(
                {error:'unable to create gift'},
                {status:500}
            )
        }

        return NextResponse.json(
            {gift},
            {status:201}
        )

    } catch (error) {
        if (error instanceof SyntaxError){
            return NextResponse.json(
                {error : 'invalid JSON request body'},
                {status:400}
            );
        }

        console.error("Create gift API error :",error)

         return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

