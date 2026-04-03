// src/workflow/api/http.js

function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
}

function isUnsafe(method) {
    return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

// Fetch CSRF cookie from backend (creates XSRF-TOKEN cookie)
async function ensureCsrfCookie() {
    await fetch("/api/auth/csrf", { credentials: "include" }).catch(() => {});
}

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
    const m = method.toUpperCase();
    const unsafe = isUnsafe(m);

    // If this is a write request and we don't have a token yet → fetch it once
    if (unsafe && !getCookie("XSRF-TOKEN")) {
        await ensureCsrfCookie();
    }

    // Build request (token may exist now)
    const doRequest = async () => {
        const csrfToken = getCookie("XSRF-TOKEN");

        const response = await fetch(path, {
            method: m,
            credentials: "include",
            headers: {
                ...(body ? { "Content-Type": "application/json" } : {}),
                ...(unsafe && csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
                "X-Debug-Client": "apiFetch-http.js",
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const text = await response.text().catch(() => "");

        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text || null;
        }

        return { response, data };
    };

    // First attempt
    let { response, data } = await doRequest();

    // If backend says 403, CSRF token might have rotated → re-fetch and retry once
    if (response.status === 403 && unsafe) {
        await ensureCsrfCookie();
        ({ response, data } = await doRequest());
    }

    if (!response.ok) {
        const message =
            typeof data === "string" ? data : data?.message || `HTTP ${response.status}`;
        throw new Error(message);
    }

    return data;
}