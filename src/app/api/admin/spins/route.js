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

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    
    const bounds = dateRange === 'all'
        ? null
        : dateRangeToUtcBounds(dateRange);

    
    let query = supabaseServer
    .from('spins')
    .select(
        `id,participant_id,gift_id,created_at,
        participants!inner(name,email,phone),
        gifts(name)`,
        {count:'exact'}
    ).order('created_at',{ascending:false})

    // outcome
    if (outcome === 'gift') query = query.not('gift_id','is',null);
    if (outcome === 'no_prize') query = query.is('gift_id',null);

    // date range 
    if (bounds){
        query = query
        .gte('created_at',bounds.start.toISOString())
        .lt('created_at',bounds.end.toISOString())
    }

    // gift filter
    if (giftId !== 'all') query = query.eq('gift_id', giftId);


    // search
    if (search){
        const pattern = `%${search}%`;
        query = query.or(
            `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`,
            {foreignTable:'participants'}
        )
    }

    

    // spins,summary and gifts fetching
        const [{data:spinRecords,error:SpinsError,count},
            {data:summaryRow,error:summaryError},
            {data:giftRecords,error:giftsError}
        ] = await Promise.all([
            query.range(from,to),
            supabaseServer.rpc('admin_spin_summary').single(),
            supabaseServer.from('gifts').select('id,name')
        ])

        if (SpinsError || summaryError){
            console.error('Spin result fetch error :',SpinsError,summaryError)

            return NextResponse.json(
                { error: 'Unable to load spin results' },
                { status: 500 }
            )
        }

        if (giftsError){
        console.error('Spin results lookup error :',giftsError);

        return NextResponse.json(
            {error:'Unable to load gift details'},
            {status:500}
        )
    }

    // summary card use all spin records,
    const summary = {
        totalSpins : summaryRow.total_spins,
        giftsWon : summaryRow.gifts_won,
        uniqueParticipants:summaryRow.unique_participants,
        noPrize : summaryRow.no_prize
    }
       
        const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

        const spins = (spinRecords ?? []).map((spin)=>{
        
        return {
            id: spin.id,
            participant_id: spin.participant_id,
            participant_name: spin.participants?.name ?? "Unknown participant",
            phone: spin.participants?.phone ?? "",
            email: spin.participants?.email ?? "",
            gift_id: spin.gift_id,
            gift_name: spin.gifts?.name ?? null,
            created_at: spin.created_at,
        };
    });

        const giftOptions = (giftRecords ?? []).map((gift) => ({
            id: gift.id,
            name: gift.name,
        }));

        return NextResponse.json({
            spins: spins,
            summary,
            giftOptions,
            pagination: {
                total:count ?? 0,
                page,
                pageSize,
                totalPages
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