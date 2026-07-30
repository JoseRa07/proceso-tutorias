import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";

const sourceRoot = path.resolve("src");
const sourceFiles = [];
const dynamicKeys = {
    "navigation.languages": ["es-MX", "en-US"],
    "common.roles": ["ADMINISTRADOR", "ALUMNO", "TUTOR", "MAESTRO"],
    "common.statusLabels": [
        "PENDIENTE",
        "COMPLETADA",
        "EDICION",
        "ACEPTADO",
        "RECHAZADO",
        "COMPLETADO",
        "ERROR",
        "EN_PROCESO"
    ],
    "reports.titles": ["1", "2", "3", "4", "default"],
    "reports.recommendationsMap": [
        "studentPending",
        "studentExcuses",
        "studentInitial",
        "adminPending",
        "adminNoSessions",
        "adminExcuses",
        "tutorPending",
        "tutorInitial",
        "tutorExcuses",
        "teacherAssignment",
        "teacherPending",
        "teacherAssigned",
        "teacherUnassigned"
    ],
    "tutoring.reasons": [
        "REPROBACION",
        "AUSENTISMO",
        "PROBLEMAS_ECONOMICOS",
        "INDISCIPLINA",
        "PROBLEMAS_PERSONALES",
        "IMPUNTUALIDAD",
        "FALTA_COMPROMISO",
        "FALTA_ATENCION"
    ]
};

const collectSourceFiles = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            collectSourceFiles(fullPath);
        } else if (/\.(js|jsx)$/.test(entry.name)) {
            sourceFiles.push(fullPath);
        }
    }
};

collectSourceFiles(sourceRoot);

const server = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
});

try {
    const { dictionaries } = await server.ssrLoadModule("/src/i18n/dictionaries/index.js");
    const staticKeys = new Set();

    for (const file of sourceFiles) {
        const source = fs.readFileSync(file, "utf8");

        for (const match of source.matchAll(/\bt\(\s*["']([^"']+)["']/g)) {
            staticKeys.add(match[1]);
        }
    }

    for (const [prefix, keys] of Object.entries(dynamicKeys)) {
        for (const key of keys) {
            staticKeys.add(`${prefix}.${key}`);
        }
    }

    const missingKeys = [];

    for (const [locale, dictionary] of Object.entries(dictionaries)) {
        for (const key of staticKeys) {
            const value = key
                .split(".")
                .reduce((current, segment) => current?.[segment], dictionary);

            if (value === undefined) {
                missingKeys.push(`${locale}: ${key}`);
            }
        }
    }

    if (missingKeys.length > 0) {
        console.error(`Missing translation keys:\n${missingKeys.join("\n")}`);
        process.exitCode = 1;
    } else {
        console.log(
            `Validated ${staticKeys.size} static translation keys across ${Object.keys(dictionaries).length} locales.`
        );
    }
} finally {
    await server.close();
}
