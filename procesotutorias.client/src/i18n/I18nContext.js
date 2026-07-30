import { createContext, useContext } from "react";

export const DEFAULT_LOCALE = "es-MX";
export const SUPPORTED_LOCALES = ["es-MX", "en-US"];
export const I18nContext = createContext(null);

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) throw new Error("useI18n must be used inside I18nProvider");
    return context;
}
