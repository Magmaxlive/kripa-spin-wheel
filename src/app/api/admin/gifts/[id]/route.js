import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(request,{params}){
    try {
        const auth = await requireAdmin();

        if(!auth.ok){
            return NextResponse.json(
                {error:auth.error},
                {status:auth.status}
            );
        }

        const {id} = await params;
        const body = await request.json();
        const updates = {};

        if('name' in body){
            if (typeof body.name !== 'string' || !body.name.trim()){
                return NextResponse.json(
                    {error:'Gift name is required.'},
                    {status:400}
                );
            }

            updates.name = body.name.trim();
        }

        if('stock' in body){
            if(!Number.isInteger(body.stock) || body.stock < 0){
                return NextResponse.json(
                    {error:'Stock must be a non-negative integer.'},
                    {status:400}
                );
            }

            updates.stock = body.stock;
        }

        if('weight' in body){
            if(!Number.isInteger(body.weight) || body.weight < 0){
                return NextResponse.json(
                    {error:'Weight must be a non-negative integer.'},
                    {status:400}
                );
            }

            updates.weight = body.weight;
        }

        if('is_active' in body){
            if(typeof body.is_active !== 'boolean'){
                return NextResponse.json(
                    {error:'Active status must be true or false'},
                    {status:400}
                )
            }
            updates.is_active = body.is_active;
        }

        if (Object.keys(updates).length === 0){
            return NextResponse.json(
                {error:'No valid fields provided to update'},
                {status:400}
            );
        }

        const {data:gift,error} = await supabaseServer
        .from('gifts')
        .update(updates)
        .eq('id',id)
        .select('id,name,stock,weight,is_active,created_at')
        .maybeSingle();

        if(error){
            console.error('Update gift error:',error);
            return NextResponse.json(
                {error:'Unable to update gift.'},
                {status:500}
            )
        }

        if(!gift){
            return NextResponse.json(
                {error:'Gift not found.'},
                {status:404}
            );
        }

        return NextResponse.json({gift})
    } catch (error) {
        if (error instanceof SyntaxError){
            return NextResponse.json(
                {error:'Invalid JSON request body.'},
                {status:400}
            )
        }

        console.error('Update gift API error :',error);

        return NextResponse.json(
            {error:'Internal server error.'},
            {status:500}
        )
    }
}

export async function DELETE(request,{params}){
    try {
        const auth = await requireAdmin();

         if(!auth.ok){
            return NextResponse.json(
                {error:auth.error},
                {status:auth.status}
            );
        }

        const {id} = await params

        const {data:gift,error:fetchError} = await supabaseServer
        .from('gifts')
        .select('id,name')
        .eq('id',id)
        .maybeSingle();

        if (fetchError){
            console.error('Fetch gift before deletion failed :',fetchError);
            return NextResponse.json(
                {error:'Unable to find gifts.'},
                {status:500}
            )
        }

        if(!gift){
            return NextResponse.json(
                {error:'Gift not found'},
                {status:404}
            )
        }

        const {error:deletError} = await supabaseServer
        .from('gifts')
        .delete()
        .eq('id',id)

        if (deletError){
            console.error('Delete gift error:',deletError)
            return NextResponse.json(
                {error:'Unable to delete gift'},
                {status:500}
            )
        }

        return NextResponse.json({
            success:true,
            message:'Gift deleted successfully',
            id:gift.id
        })
    } catch (error) { 
         console.error("Delete gift API error:", error);

        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}