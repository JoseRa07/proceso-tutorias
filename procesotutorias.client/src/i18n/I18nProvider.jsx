import { useCallback, useEffect, useMemo, useState } from "react";
import { dictionaries } from "./dictionaries";
import { DEFAULT_LOCALE, I18nContext, SUPPORTED_LOCALES } from "./I18nContext";
const STORAGE_KEY = "locale";

const getStoredLocale = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
};

const getByPath = (source, path) => path
    .split(".")
    .reduce((value, key) => value?.[key], source);

const interpolate = (value, params) => Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{{${key}}}`, String(replacement)),
    value
);

export function I18nProvider({ children }) {
    const [locale, setLocaleState] = useState(getStoredLocale);

    const setLocale = useCallback((nextLocale) => {
        if (!SUPPORTED_LOCALES.includes(nextLocale)) return;
        setLocaleState(nextLocale);
        localStorage.setItem(STORAGE_KEY, nextLocale);
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const t = useCallback((path, params = {}) => {
        const translated = getByPath(dictionaries[locale], path)
            ?? getByPath(dictionaries[DEFAULT_LOCALE], path)
            ?? path;

        return typeof translated === "string"
            ? interpolate(translated, params)
            : translated;
    }, [locale]);

    useEffect(() => {
        document.title = t("common.appName");
    }, [t]);

    const formatDate = useCallback((value, options = { dateStyle: "medium" }) => {
        if (!value) return t("common.noDate");
        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, options).format(date);
    }, [locale, t]);

    const value = useMemo(() => ({
        locale,
        setLocale,
        t,
        formatDate,
        supportedLocales: SUPPORTED_LOCALES
    }), [locale, setLocale, t, formatDate]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
