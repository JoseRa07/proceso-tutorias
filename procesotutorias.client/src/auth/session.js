import { useEffect, useState } from "react";

export const ROLES = Object.freeze({
    ADMIN: 1,
    ALUMNO: 2,
    TUTOR: 3,
    MAESTRO: 4
});

export const AUTHENTICATED_ROLES = Object.freeze(Object.values(ROLES));

const ROLE_NAMES = Object.freeze({
    [ROLES.ADMIN]: "ADMIN",
    [ROLES.ALUMNO]: "ALUMNO",
    [ROLES.TUTOR]: "TUTOR",
    [ROLES.MAESTRO]: "MAESTRO"
});

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const NAME_ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

const decodeBase64Url = (value) => {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    return atob(normalized + padding);
};

export const decodeTokenPayload = (token) => {
    if (typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    try {
        return JSON.parse(decodeBase64Url(parts[1]));
    } catch {
        return null;
    }
};

const parseStoredUser = (storedUser) => {
    if (!storedUser) return null;

    try {
        const user = JSON.parse(storedUser);
        return user && typeof user === "object" ? user : null;
    } catch {
        return null;
    }
};

export const validateStoredSession = (storedUser, token, nowInSeconds = Date.now() / 1000) => {
    const user = parseStoredUser(storedUser);
    const payload = decodeTokenPayload(token);
    const roleId = Number(user?.id_rol);
    const userId = Number(user?.id_usuario);

    if (!user || !payload || !AUTHENTICATED_ROLES.includes(roleId) || !Number.isInteger(userId)) {
        return null;
    }

    if (typeof payload.exp !== "number" || payload.exp <= nowInSeconds) {
        return null;
    }

    const tokenRole = payload.role ?? payload[ROLE_CLAIM];
    const tokenUserId = Number(payload.nameid ?? payload.sub ?? payload[NAME_ID_CLAIM]);
    const tokenEmail = payload.email ?? payload[EMAIL_CLAIM];

    if (
        String(tokenRole).toUpperCase() !== ROLE_NAMES[roleId] ||
        tokenUserId !== userId ||
        (tokenEmail && tokenEmail !== user.correo)
    ) {
        return null;
    }

    return {
        user: { ...user, id_rol: roleId, id_usuario: userId },
        token,
        expiresAt: payload.exp * 1000
    };
};

export const clearAuthSession = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
};

export const getAuthSession = () => {
    const storedUser = localStorage.getItem("usuario");
    const token = localStorage.getItem("token");
    const session = validateStoredSession(storedUser, token);

    if (!session && (storedUser || token)) {
        clearAuthSession();
    }

    return session;
};

export const useAuthSession = () => {
    const [session, setSession] = useState(() => getAuthSession());
    const expiresAt = session?.expiresAt;

    useEffect(() => {
        const refreshSession = () => setSession(getAuthSession());
        const remainingTime = expiresAt ? Math.max(expiresAt - Date.now(), 0) : null;
        const expirationTimer = remainingTime === null
            ? null
            : window.setTimeout(refreshSession, Math.min(remainingTime, 2_147_483_647));

        window.addEventListener("storage", refreshSession);

        return () => {
            window.removeEventListener("storage", refreshSession);
            if (expirationTimer !== null) window.clearTimeout(expirationTimer);
        };
    }, [expiresAt]);

    return session;
};
