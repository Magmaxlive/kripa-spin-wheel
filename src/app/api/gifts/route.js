import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('gifts')
            .select('id,name')
            .eq('is_active', true)
            .gt('stock', 0)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Gifts fetch error:', error);
            return NextResponse.json(
                { error: 'Unable to load gifts. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ gifts: data ?? [] });
    } catch (error) {
        console.error('Gifts API error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
