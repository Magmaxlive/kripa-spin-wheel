import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
    checkRegistrationRate,
    extractIp,
    normalizePhone,
} from "@/lib/rate-limit";

// `reason` is accepted on the input shape but intentionally not
// returned to the client - exposing which bucket (ip vs phone) was
// tripped would help an attacker probe limits. It is logged elsewhere.
function rateLimitResponse({ status, retryAfter }) {
    const body = { error: "Too many requests. Please try again later." };
    const headers = {};
    if (retryAfter && status === 429) {
        headers["Retry-After"] = String(retryAfter);
    }
    return NextResponse.json(body, { status, headers });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, phone, email } = body ?? {};

        // Validate the phone before rate-limiting so we can key the
        // phone bucket on a normalized value. An invalid phone is a 400
        // and does NOT consume rate-limit budget.
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) {
            return NextResponse.json(
                { error: "Please enter a valid phone number." },
                { status: 400 }
            );
        }

        const ip = extractIp(request);
        const rate = await checkRegistrationRate({
            ip,
            phone: normalizedPhone,
        });
        if (!rate.ok) {
            return rateLimitResponse(rate);
        }

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
            console.error("Supabase error:", {
                code: error.code,
                message: error.message,
            });

            if (
                error.code === "23505" &&
                error.message.includes("participants_phone_key")
            ) {
                return NextResponse.json(
                    { error: "This number has already been registered." },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: "Unable to complete registration. Please try again." },
                { status: 400 }
            );
        }

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

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "Invalid request body." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Unable to complete registration. Please try again." },
            { status: 500 }
        );
    }
}
