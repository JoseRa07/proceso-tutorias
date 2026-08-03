import { aboutDictionary } from "./about";
import { administrationDictionary } from "./administration";
import { authDictionary } from "./auth";
import { backupsDictionary } from "./backups";
import { commonDictionary } from "./common";
import { excusesDictionary } from "./excuses";
import { followupDictionary } from "./followup";
import { navigationDictionary } from "./navigation";
import { panelDictionary } from "./panel";
import { reportsDictionary } from "./reports";
import { tutoringDictionary } from "./tutoring";

const modules = {
    common: commonDictionary,
    navigation: navigationDictionary,
    auth: authDictionary,
    panel: panelDictionary,
    about: aboutDictionary,
    tutoring: tutoringDictionary,
    excuses: excusesDictionary,
    followup: followupDictionary,
    administration: administrationDictionary,
    reports: reportsDictionary,
    backups: backupsDictionary
};

export const dictionaries = Object.keys(commonDictionary).reduce((locales, locale) => {
    locales[locale] = Object.fromEntries(
        Object.entries(modules).map(([name, dictionary]) => [name, dictionary[locale]])
    );
    return locales;
}, {});
