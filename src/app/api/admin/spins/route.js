import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { supabaseServer } from "@/lib/supabase/server";
import { dateRangeToUtcBounds } from "@/lib/time/nz";

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
        const search = (searchParams.get('search') ?? '').trim().toLowerCase();
        const outcome = searchParams.get('outcome') ?? 'all';
        const giftId = searchParams.get('giftId') ?? 'all';
        const dateRange = searchParams.get('dateRange') ?? 'all';
        const page = Number(searchParams.get('page') ?? 1);
        const pageSize = Number(searchParams.get('pageSize') ?? 10);


        if (!Number.isInteger(page) || page < 1) {
            return NextResponse.json(
                { error: "Invalid page number." },
                { status: 400 }
            );
        }

        if (![10, 25, 50].includes(pageSize)) {
            return NextResponse.json(
                { error: "pageSize must be 10, 25 or 50." },
                { status: 400 }
            );
        }

        if (!['all','gift','no_prize'].includes(outcome)){
        return NextResponse.json(
            {error:'Invalid Outcome filter'},
            {status:400}
        );
    }

    if (!['all','today','last_7','last_30'].includes(dateRange)){
        return NextResponse.json(
            {error:'Invalid date range'},
            {status:400}
        );
    }

    // Compute Pacific/Auckland date bounds once per request. The result
    // is a pair of UTC Date instants bracketing the active NZ calendar
    // range (start inclusive, end exclusive). Null for "all".
    const bounds = dateRange === 'all'
        ? null
        : dateRangeToUtcBounds(dateRange);


    // spin records
    const {data:spinRecords,error:spinError} = await supabaseServer
        .from('spins')
        .select('id,participant_id,gift_id,created_at')
        .order('created_at',{ascending:false})

    if(spinError){
        console.error("Spin results fetch error :",spinError);

        return NextResponse.json(
            {error:'Unable to load spin results'},
            {status:500}
        )
    }

    // participant and gift information

    const [
        {data:participantRecords,error:participantsError},
        {data:giftRecords,error:giftsError},
    ] = await Promise.all([
        supabaseServer
        .from('participants')
        .select('id,name,phone,email'),

        supabaseServer
        .from('gifts')
        .select('id,name')
    ]);

    if (participantsError || giftsError){
        console.error('Spin results lookup error :',participantsError,giftsError);

        return NextResponse.json(
            {error:'Unable to load participant or gift details'},
            {status:500}
        )
    }

    const partcipantsMap = new Map(
        (participantRecords ?? []).map((participant)=>[
            participant.id,
            participant,
        ])
    )

     const giftsMap = new Map(
        (giftRecords ?? []).map((gift)=>[
            gift.id,
            gift,
        ])
    )

    const allSpins = (spinRecords ?? []).map((spin)=>{
        const participant = partcipantsMap.get(spin.participant_id);
        const gift = spin.gift_id ? giftsMap.get(spin.gift_id) : null;

        return {
            id: spin.id,
            participant_id: spin.participant_id,
            participant_name: participant?.name ?? "Unknown participant",
            phone: participant?.phone ?? "",
            email: participant?.email ?? "",
            gift_id: spin.gift_id,
            gift_name: gift?.name ?? null,
            created_at: spin.created_at,
        };
    });

    // summary card use all spin records,

    const uniquePartcipants = new Set(
        allSpins.map((spin)=> spin.participant_id).filter(Boolean)
    )

    const giftsWon = allSpins.filter((spin)=>spin.gift_id).length;

    const summary = {
        totalSpins : allSpins.length,
        giftsWon,
        uniqueParticipants:uniquePartcipants.size,
        noPrize : allSpins.length - giftsWon
    }

    // apply search,outcome,gift and date filter

    let filteredSpins = allSpins.filter((spin)=>{
        const matchesSearch =
        !search ||
        spin.participant_name.toLowerCase().includes(search) ||
        spin.phone.toLowerCase().includes(search)||
        spin.email.toLowerCase().includes(search);

        const hasGift = Boolean(spin.gift_id);

        const matchesOutcome = 
        outcome === 'all' ||
        (outcome === 'gift' && hasGift) ||
        (outcome === 'no_prize' && !hasGift)

        const matchesGift =
            giftId === 'all' || spin.gift_id === giftId;

        let matchesDate = true;

        if (dateRange !== "all") {
            const spinDate = new Date(spin.created_at);
            matchesDate =
                !Number.isNaN(spinDate.getTime()) &&
                spinDate >= bounds.start &&
                spinDate < bounds.end;
        }

        return (
            matchesDate && matchesGift && matchesOutcome && matchesSearch
        )


     });

     const total = filteredSpins.length;
        const totalPages = Math.ceil(total / pageSize);
        const from = (page - 1) * pageSize;

        filteredSpins = filteredSpins.slice(from, from + pageSize);

        const giftOptions = (giftRecords ?? []).map((gift) => ({
            id: gift.id,
            name: gift.name,
        }));

        return NextResponse.json({
            spins: filteredSpins,
            summary,
            giftOptions,
            pagination: {
                total,
                page,
                pageSize,
                totalPages,
            },
        });


    } catch (error) {
        console.error("Spin results API error:", error);

        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}