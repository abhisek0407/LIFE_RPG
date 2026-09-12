export const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// Creates an isolated client with its own token, so each test file
// (and each user within a test file) can act independently.
export function makeApiClient() {
    let token = null;

    async function api(method, path, body, useAuth = true) {
        const headers = { "Content-Type": "application/json" };
        if (useAuth && token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        let data = null;
        try {
            data = await res.json();
        } catch {
            // no JSON body (e.g. 204)
        }

        return { status: res.status, data };
    }

    return {
        api,
        setToken: (t) => { token = t; },
        getToken: () => token,
    };
}

export async function ensureServerUp() {
    try {
        await fetch(BASE_URL);
    } catch {
        throw new Error(
            `❌ Cannot reach ${BASE_URL}. Start your server first: nodemon server.js`
        );
    }
}