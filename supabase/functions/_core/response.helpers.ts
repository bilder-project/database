import { CORS_HEADERS } from "../_consts/cors-headers.ts";

export const corsResponse = () => successResponse(null);

export const successResponse = (
    content: any,
    headers: HeadersInit = {},
    status = 200,
) => content
    ? new Response(JSON.stringify(content), {
        headers: {
            ...CORS_HEADERS,
            ...headers,
            "Content-Type": "application/json",
        },
        status: status,
    })
    : new Response(undefined, {
        headers: {
            ...CORS_HEADERS,
            ...headers,
        },
        status: status,
    });

export const errorResponse = (
    message: string | undefined,
    headers: HeadersInit = {},
    status = 400,
) => message
    ? new Response(JSON.stringify({ message: message }), {
        headers: {
            ...CORS_HEADERS,
            ...headers,
            "Content-Type": "application/json",
        },
        status: status,
    })
    : new Response(undefined, {
        headers: {
            ...CORS_HEADERS,
            ...headers,
            "Content-Type": "application/json",
        },
        status: status,
    });
