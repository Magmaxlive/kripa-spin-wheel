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
    const search = searchParams.get('search')?.trim()?? '';
    const spinStatus = searchParams.get('spinStatus') ?? 'all';
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

    // fetch participants and their spin records

    let query = supabaseServer
    .from('pariticipants')
    .select(
        'id,name,phone,email,created_at,spins(id)',
        {count:'exact'}
    );

    // search name,phone,email

    if(search){
        const safeSearch = search.replace(/[,%()]/g, "");
        if(safeSearch){
            query = query.or(
                `name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`
            );
        }
    }

    // apply sin status filter using the related spins records

    if (spinStatus === 'spun'){
        query = query.not('spins','is',null);
    } else if (spinStatus === 'not_spun'){
        query = query.is('spins',null)
    }

    const from = ( page -1 ) * pageSize;
    const to = from + pageSize - 1;

    const {data,error,count} = await query
    .order('created_at',{ascending:false})
    .range(from,to)

    if (error){
        console.error('Participants fetch error :',error);
        return NextResponse.json(
            {error : 'Unable to load participants. Please try again.'},
            {status:500}
        );
    }

    const participants = (data ?? []).map((participant)=>({
        id:participant.id,
        name:participant.name,
        phone:participant.phone,
        email:participant.email,
        created_at:participant.created_at,
        has_spun: Array.isArray(participant.spins)
        ? participant.spins.length > 0
        : false
    }));

    return NextResponse.json(
        {participants,
            pagination:{
                page,
                pageSize,
                total: count ?? 0,
                totalPages: Math.ceil((count ?? 0)/ pageSize),
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