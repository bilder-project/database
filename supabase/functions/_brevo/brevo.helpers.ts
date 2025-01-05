import {
    corsResponse,
    errorResponse,
    successResponse,
} from "../_core/response.helpers.ts";

import { Email } from "./types.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_URL = Deno.env.get("BREVO_URL");

export const sendBrevoEmail = async (emailBody: Email) => {
    if (!BREVO_API_KEY) {
        console.error("BREVO_API_KEY not set");
        return new Response("BREVO_API_KEY not set", { status: 500 });
    }

    if (!BREVO_URL) {
        console.error("BREVO_URL not set");
        return new Response("BREVO_URL not set", { status: 500 });
    }

    const emailResponse = await fetch(`${BREVO_URL}/smtp/email`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify(emailBody),
    });

    if (!emailResponse.ok || emailResponse.status >= 300) {
        console.error("Email not sent, received status ", emailResponse.status);
        console.error(emailResponse);
        return errorResponse(
            "Error while sending email",
            {},
            emailResponse.status,
        );
    }

    return successResponse("Email sent", {});
};
