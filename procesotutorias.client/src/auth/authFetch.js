import { API_URL } from "../api";
import { clearAuthSession, decodeTokenPayload } from "./session";

const originalFetch = window.fetch.bind(window);
let refreshPromise = null;
let refreshTimer = null;
let installed = false;

const getRequestUrl = (input) =>
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

const isApiRequest = (url) =>
    url.startsWith(API_URL) || url.startsWith(`${window.location.origin}${API_URL}`);

const isSessionEndpoint = (url) =>
    /\/api\/Login(?:\/(?:refresh|logout))?(?:\?|$)/i.test(url);

const scheduleRefresh = (token) => {
    if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    const expiresAtSeconds = decodeTokenPayload(token)?.exp;
    if (typeof expiresAtSeconds !== "number") return;

    const expiresAt = expiresAtSeconds * 1000;
    const delay = Math.max(expiresAt - Date.now() - 60_000, 0);
    refreshTimer = window.setTimeout(async () => {
        refreshTimer = null;
        if (await refreshSession()) return;

        const remainingTime = expiresAt - Date.now();
        if (remainingTime > 0) {
            refreshTimer = window.setTimeout(async () => {
                refreshTimer = null;
                if (!await refreshSession()) finishInvalidSession();
            }, Math.min(remainingTime, 2_147_483_647));
            return;
        }

        finishInvalidSession();
    }, Math.min(delay, 2_147_483_647));
};

export const storeAuthSession = (data) => {
    if (!data?.token || !data?.user) return false;
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.user));
    scheduleRefresh(data.token);
    return true;
};

const finishInvalidSession = (revokeServerSession = true) => {
    if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    if (revokeServerSession) {
        originalFetch(`${API_URL}/Login/logout`, {
            method: "POST",
            credentials: "same-origin",
            keepalive: true
        }).catch(() => undefined);
    }

    clearAuthSession();
    sessionStorage.clear();
    if (window.location.pathname !== "/") {
        window.location.replace("/");
    }
};

const refreshSession = async () => {
    if (!refreshPromise) {
        refreshPromise = originalFetch(`${API_URL}/Login/refresh`, {
            method: "POST",
            credentials: "same-origin"
        })
            .then(async (response) => {
                if (!response.ok) return false;
                return storeAuthSession(await response.json());
            })
            .catch(() => false)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

export const authFetch = async (input, init = {}) => {
    const url = getRequestUrl(input);
    if (!isApiRequest(url)) return originalFetch(input, init);

    const send = () => {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        const token = localStorage.getItem("token");

        if (token && !isSessionEndpoint(url)) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return originalFetch(input, {
            ...init,
            headers,
            credentials: init.credentials ?? "same-origin"
        });
    };

    let response = await send();
    if (response.status === 401 && !isSessionEndpoint(url)) {
        if (await refreshSession()) {
            response = await send();
        }
    }

    if ((response.status === 401 || response.status === 403) && !isSessionEndpoint(url)) {
        finishInvalidSession();
    }

    return response;
};

export const installAuthFetch = () => {
    if (installed) return;
    window.fetch = authFetch;
    installed = true;

    const token = localStorage.getItem("token");
    if (token) scheduleRefresh(token);
};

export const logout = async () => {
    try {
        await originalFetch(`${API_URL}/Login/logout`, {
            method: "POST",
            credentials: "same-origin"
        });
    } finally {
        finishInvalidSession(false);
    }
};
