const SENSITIVE_DETAIL_PATTERN = /(?:system\.|microsoft\.|innerexception|stack\s*trace|sql(?:exception)?|server\s*=|database\s*=|password\s*=|data source\s*=|c:\\|\/home\/|\/app\/|\bat\s+\S+\([^)]*:\d+\))/i;
const SAFE_REFERENCE_PATTERN = /^[a-zA-Z0-9_.:-]{1,100}$/;

const safeServerMessage = (value) => {
    if (typeof value !== "string") return "";

    const message = value.trim();
    if (!message || message.length > 400 || SENSITIVE_DETAIL_PATTERN.test(message)) return "";
    return message;
};

export const getApiErrorMessage = async (response, fallbackMessage) => {
    let data = null;

    try {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) data = await response.json();
    } catch {
        data = null;
    }

    const message = safeServerMessage(data?.message) || fallbackMessage;
    const traceId = SAFE_REFERENCE_PATTERN.test(data?.traceId || "") ? data.traceId : "";

    return response.status >= 500 && traceId
        ? `${message} Referencia: ${traceId}`
        : message;
};

export const readApiJson = async (response, fallbackMessage) => {
    if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, fallbackMessage));
    }

    try {
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch {
        throw new Error(fallbackMessage);
    }
};
