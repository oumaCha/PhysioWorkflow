// src/workflow/api/request.js
// Simple wrapper around fetch that always uses cookies

export async function request(url, options = {}) {
    const hasBody =
        options.body !== undefined && options.body !== null;

    const res = await fetch(url, {
        ...options,
        credentials: "include", // <-- ALWAYS send cookie
        headers: {
            "Content-Type": hasBody
                ? "application/json"
                : undefined,
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
    }

    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return await res.json();
    }
    return await res.text();
}
