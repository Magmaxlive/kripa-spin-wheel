
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);
}

export async function POST() {
    try {
        // Get participant token from cookie
        const cookieStore = await cookies();
        const token = cookieStore.get("participant_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Please register before spinning." },
                { status: 401 }
            );
        }

        // Verify participant
        const {
            data: participant,
            error: participantError,
        } = await supabaseServer
            .from("participants")
            .select("id")
            .eq("access_token", token)
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                {
                    error: "Participant not found. Please register again.",
                },
                { status: 401 }
            );
        }

        // Perform spin in Supabase
        const { data, error } = await supabaseServer.rpc(
            "perform_spin",
            { p_participant_id: participant.id }
        );

        if (error) {
            console.error("Spin RPC error:", error);

            if (error.message.includes("ALREADY_SPUN")) {
                return NextResponse.json(
                    {
                        error: "You have already used your spin.",
                        alreadySpun: true,
                    },
                    { status: 409 }
                );
            }

            if (error.message.includes("NO_GIFTS_AVAILABLE")) {
                return NextResponse.json(
                    {
                        error: "Sorry, all gifts are currently unavailable.",
                    },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                {
                    error: "Unable to complete your spin. Please try again.",
                },
                { status: 500 }
            );
        }

        // No prize: return the result without sending an email.
        if (!data.won || !data.gift) {
            return NextResponse.json({
                ...data,
                message: "Sorry, better luck next time!",
            });
        }

        // Actual prize: look up participant's email.
        const giftName = data.gift.name;

        const {
            data: participantDetails,
            error: emailLookupError,
        } = await supabaseServer
            .from("participants")
            .select("name, email")
            .eq("id", participant.id)
            .single();

        if (emailLookupError) {
            console.error("Participant email lookup failed:", emailLookupError);
        }

        if (participantDetails?.email) {
            try {
                const { error: sendError } = await resend.emails.send({
                    from: process.env.EMAIL_FROM,
                    to: participantDetails.email,
                    subject: "Your Spin & Win Result",
                    html: `
                        <h2>Congratulations, ${escapeHtml(participantDetails.name)}!</h2>
                        <p>Thank you for participating in our Spin & Win campaign.</p>
                        <p>You won:</p>
                        <h3>${escapeHtml(giftName)}</h3>
                        <p>Thank you for participating!</p>
                    `,
                });

                if (sendError) {
                    console.error("Spin result email failed:", sendError);
                }
            } catch (emailError) {
                console.error("Spin result email error:", emailError);
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Spin API error:", error);

        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}