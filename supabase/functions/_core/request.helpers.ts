export const getAuthHeader = (req: Request): string | null =>
    req.headers.get("Authorization");
