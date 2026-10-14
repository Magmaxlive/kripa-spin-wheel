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

    // fetch participants and their spin records

    let query = supabaseServer
    .from('participants')
    .select(
        'id,name,phone,email,created_at',
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

    const {data:spins,error:spinsError} = await supabaseServer
    .from('spins')
    .select('participant_id');

    if (spinsError){
        console.error('Participant spins fetch error :',spinsError);

        return NextResponse.json(
            {error:'Unable to load participant spin status.'},
            {status:500}
        )
    }

    const spunIds = new Set(
        (spins ?? []).map((spin)=> spin.participant_id)
    )

        let participants = (data ?? []).map((participant) => ({
        ...participant,
        has_spun: spunIds.has(participant.id),
    }));


    console.log("Spin filter received:", spinStatus);
console.log(
    "Participant statuses:",
    participants.map((p) => ({
        name: p.name,
        has_spun: p.has_spun,
    }))
);



    // apply sin status filter using the related spins records

    if (spinStatus === 'spun'){
        participants = participants.filter(
            (participant) => participant.has_spun
        );
    } else if (spinStatus === 'not_spun'){
        participants = participants.filter(
            (participant) => !participant.has_spun
        );
    }

    const total = participants.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedParticipants = participants.slice(
        startIndex,
        startIndex + pageSize
    );


    return NextResponse.json(
        {participants:paginatedParticipants,
        total,
        page,
        pageSize,
        });

    } catch (error) {
        console.error("Participants API error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }

}