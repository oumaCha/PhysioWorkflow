// src/workflow/api/http.js
// Unified cookie-based helper for your whole app

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
    const res = await fetch(path, {
        method,
        credentials: "include",              // <-- KEY: send/receive session cookie
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text().catch(() => "");

    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text || null;
    }

    if (!res.ok) {
        const msg =
            typeof data === "string"
                ? data
                : data?.message || JSON.stringify(data);
        throw new Error(msg || `HTTP ${res.status}`);
    }

    return data;
}
