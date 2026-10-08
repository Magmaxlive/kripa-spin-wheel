import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request) {
    try {
        const { name, phone, email } = await request.json();

        console.log("Registration request:", { name, phone, email });

        const { data, error } = await supabaseServer
            .from("participants")
            .insert({
                name,
                phone,
                email: email || null,
            })
            .select("id, access_token")
            .single();

        if (error) {
            console.error("Supabase error:", error);

           if (error.code === "23505" && error.message.includes("participants_phone_key")) {
            return NextResponse.json(
                {
                    error: "This number has already been registered.",
                },
                { status: 409 }
            );
            }

            return NextResponse.json(
            {
                error: "Unable to complete registration. Please try again.",
            },
            { status: 400 }
        );

        }

        console.log("Participant created:", data);

        const response = NextResponse.json({
            success: true,
        });

        response.cookies.set("participant_token", data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Register API error:", error);

        return NextResponse.json(
            {
                error: error instanceof Error
                    ? error.message
                    : "Registration failed",
            },
            { status: 500 }
        );
    }
}