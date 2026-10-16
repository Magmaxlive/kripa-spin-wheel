import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET(request){
    try {
        const auth = await requireAdmin();

    if (!auth.ok){
        return NextResponse.json(
            {error:auth.error},
            {status:auth.status}
        )
    }

    const {searchParams} = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const spinStatus = searchParams.get('status') ?? 'all';
    const page = Number(searchParams.get('page')?? 1);
    const pageSize = Number(searchParams.get('pageSize') ?? 10);

    


    // validate filters

    if (!Number.isInteger(page) || page < 1){
        return NextResponse.json(
            {error:'Invalid page number.'},
            {status:400}
        );
    }

    if (![10,25,50].includes(pageSize)){
        return NextResponse.json(
            {error:'pageSize must be 10,25 or 50'},
            {status:400}
        );
    }

    if (!['all','spun','not_spun'].includes(spinStatus)){
        return NextResponse.json(
            {error:'Invalid spinStatus filter'},
            {status:400}
        );
    }

    const from = ( page -1 ) * pageSize;
    const to = from + pageSize - 1;

    // fetch participants 

    let query = supabaseServer
    .from('participants_with_spin_status')
    .select(
        'id,name,phone,email,created_at,has_spun',
        {count:'exact'}
    ).order('created_at',{ascending:false})

    // search name,phone,email

    if(search){
        const safeSearch = search.replace(/[,%()]/g, "");
        if(safeSearch){
            const pattern = `%${safeSearch}%`
            query = query.or(
                `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`
            );
        }
    }

    



    // apply spin status filter using the related spins records

    if (spinStatus === 'spun') query = query.eq('has_spun',true)
    if (spinStatus === 'not_spun') query = query.eq('has_spun',false)

    const {data:participantData,error:participantError,count} = await query.range(from,to)

    if (participantError){
        console.error('Participant fetch error :',participantError)

        return NextResponse.json(
            { error: 'Unable to load participants. Please try again.' },
            { status: 500 }
        );
    }

    const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

    return NextResponse.json(
        {participants: participantData ?? [],
            pagination:{
                total: count ?? 0,
                page,
                pageSize,
                totalPages
            },
        });

    } catch (error) {
        console.error("Participants API error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }

}