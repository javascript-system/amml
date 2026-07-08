const fs = require("fs-extra");
const path = require("path");
const readlineSync = require('readline-sync');
const AdmZip = require('adm-zip');
const log = require("../log.js");
const validateObject = require("../validateObj.js");


const getTargetIdentifier = (target) => {
    if (!target.includes("://")) return target;
    const compUrl = `${target.startsWith("https://") ? "" : "https://"}${target}`;
    return compUrl.replace(/^https?:\/\//, '').replace(/\//g, '$SLASH');
};

const isMatch = (target, file, internalName, exportName) => {
    const t = target.toLowerCase();
    const f = file.replace(/\.js$/, '').toLowerCase();

    return (
        file.toLowerCase() === t ||
        f === t ||
        (internalName && internalName.toLowerCase() === t) ||
        (exportName && exportName.toLowerCase() === t)
    );
};

const findPlugin = (target, pluginsDir) => {
    const files = fs.readdirSync(pluginsDir);
    const pluginRegex = /^\/\*\*@plugin\s+([a-zA-Z]+)\*\//;

    for (const file of files) {
        const fullPath = path.join(pluginsDir, file);

        if (isMatch(target, file, null, null)) {
            return { fullPath, file };
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const match = content.match(pluginRegex);
            const internalName = match ? match[1] : null;

            if (isMatch(target, file, internalName, null)) {
                return { fullPath, file };
            }

            delete require.cache[require.resolve(fullPath)];
            const plugin = require(fullPath);
            if (isMatch(target, file, internalName, plugin.name)) {
                return { fullPath, file, plugin };
            }
        } catch (e) { }
    }
    return null;
};

async function pluginsFun(args) {
    const pluginsDir = path.resolve(path.join(__dirname, "../", "lang", "plugins"));
    try {
        if (!args[0]) throw new Error("Missing argument: plugins func.");
        const cmd = args[0];

        if (cmd === "install") {
            const input = require('readline-sync').question;
            const url = input("Insert an URL to download to the plugin:\n");
            const checkInternet = require("../internet.js");
            const hasInternet = await checkInternet();
            let compUrl = `${url.startsWith("https://") ? "" : "https://"}${url}`;
            const safeName = compUrl.replace(/^https?:\/\//, '').replace(/\//g, '$SLASH');
            const pluginsPath = path.join(pluginsDir, safeName);

            if (hasInternet) {
                const fetchHref = require("../fetch.js");
                try {
                    const code = await fetchHref(compUrl, false);
                    await fs.ensureDir(pluginsDir);
                    await fs.outputFile(pluginsPath, code);
                    log(`Fetch successful, downloaded plugin.`);
                } catch (err) {
                    throw new Error(`Fetch failed: ${err.message}.`);
                }
            }
            else { throw new Error(`Impossible to fetch: No internet.`) }
        }

        else if (cmd === "add") {
            if (!args[1]) throw new Error("Missing argument: local file path.");
            const localPath = path.resolve(args[1]);

            if (!fs.existsSync(localPath)) throw new Error(`File not found: ${localPath}`);
            if (!fs.statSync(localPath).isFile()) throw new Error(`Path is not a file: ${localPath}`);

            const fileName = path.basename(localPath);
            const destPath = path.join(pluginsDir, fileName);

            await fs.ensureDir(pluginsDir);
            await fs.copy(localPath, destPath);
            log(`Plugin added successfully: ${fileName}`);
        }

        else if (cmd === "remove") {
            if (!args[1]) throw new Error("Missing argument: plugin name, file, or URL.");
            const target = getTargetIdentifier(args[1]);
            const found = findPlugin(target, pluginsDir);

            if (!found) throw new Error(`Plugin "${args[1]}" not found.`);

            await fs.remove(found.fullPath);
            log(`Plugin "${found.file}" removed successfully.`);
        }

        else if (cmd === "info") {
            if (!args[1]) throw new Error("Missing argument: plugin name.");
            const target = getTargetIdentifier(args[1]);
            const showFunction = args.includes("--function");

            const found = findPlugin(target, pluginsDir);
            if (!found) throw new Error(`Plugin "${args[1]}" not found.`);

            let plugin = found.plugin;
            if (!plugin) {
                delete require.cache[require.resolve(found.fullPath)];
                plugin = require(found.fullPath);
            }

            if (typeof plugin !== "object") { throw new Error(`Plugin "${args[1]} don't exports an object."`) }
            const licenseName = typeof plugin.license === "string" ? plugin.license : "None";
            const licenseUrl = `https://choosealicense.com/licenses/${licenseName.toLowerCase().replace(/\s+/g, '-')}`;
            const licenseOutput = licenseName !== "None" ? `\u001b]8;;${licenseUrl}\u001b\\${licenseName}\u001b]8;;\u001b\\` : "None";
            console.log(`Plugin ${typeof plugin.name === "string" ? plugin.name : "Unknown"} ${typeof plugin.version === "string" ? plugin.version : "?.?.?"} Information`);
            console.log(`author: "${typeof plugin.author === "string" ? plugin.author : "Unknown"}"`);
            console.log(`license: ${licenseOutput}`);
            console.log(`description: "${typeof plugin.description === "string" ? plugin.description : "Not provided."}"`);
            console.log(`supports: ${Array.isArray(plugin.supports) ? plugin.supports.join(", ") : "Not provided"}`);
            console.log(`code example: "${typeof plugin.example === "string" ? plugin.example : "None"}"`);
            console.log(`Requires internet: ${typeof plugin.dependencies?.requiresInternet === "boolean" ? String(plugin.dependencies?.requiresInternet) : "false"}`);
            console.log(`Required commands: ${Array.isArray(plugin.dependencies?.commands) ? plugin.dependencies?.commands.length > 0 ? plugin.dependencies?.commands.join(", ") : "None" : "Not provided"}`);
            if (showFunction) {
                console.log("\ncode logic:");
                console.log(plugin.func ? plugin.func.toString() : "No logic defined.");
            }
        }

        else if (cmd === "list") {
            const files = fs.readdirSync(pluginsDir);
            const pluginRegex = /^\/\*\*@plugin\s+([a-zA-Z]+)\*\//;
            log("Installed plugins:");
            if (files.length === 0) {
                console.log("None");
            } else {
                for (const file of files) {
                    const fullPath = path.join(pluginsDir, file);
                    let displayName = file;
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const match = content.match(pluginRegex);
                        const headerName = match ? match[1] : null;
                        let exportName = null;
                        try {
                            delete require.cache[require.resolve(fullPath)];
                            const plugin = require(fullPath);
                            exportName = plugin.name;
                        } catch (e) { }
                        displayName = exportName || headerName || file;
                    } catch (err) { }
                    console.log(`${displayName} (${file})`);
                }
            }
        }
        else if (cmd === "doctor") {
            if (!args[1]) throw new Error("Missing argument: plugin name.");

            const template = {
                name: "!string",
                version: "string",
                author: "string",
                license: "?string",
                description: "?string",
                supports: { type: "array", basic: "!string" },
                example: "?string",
                returnsCode: "boolean",
                dependencies: {
                    type: "object",
                    template: {
                        requiresInternet: "boolean",
                        commands: {
                            type: "?array",
                            basic: "!string"
                        }
                    }
                },
                func: "!function"
            };

            const target = getTargetIdentifier(args[1]);
            const found = findPlugin(target, pluginsDir);
            if (!found) throw new Error(`Plugin "${args[1]}" not found.`);
            let plugin = found.plugin;
            if (!plugin) {
                delete require.cache[require.resolve(found.fullPath)];
                plugin = require(found.fullPath);
            }
            const { valid, missing } = validateObject(template, plugin);
            log(`Doctor Report for: ${found.file}`);
            const validKeys = Object.keys(valid);
            if (validKeys.length > 0) log(`Valid fields: ${validKeys.join(", ")}`);
            const missingEntries = Object.entries(missing);
            if (missingEntries.length > 0) {
                log(`Issues found:`);
                for (const [key, data] of missingEntries) { log(`- ${key}: ${data.msg}`, data.type) }
                log(`How to fix:`);
                for (const [key, data] of missingEntries) {
                    const cleanType = template[key].replace(/[!?]/g, '');
                    if (data.type === 'ERR') { log(`Fix field "${key}" (Required type: ${cleanType})`, "ERR") }
                    else { log(`Add optional field "${key}" (Type: ${cleanType})`, "WARN") }
                }
            }
            else { log(`All required fields are healthy!`) }
        }
        else if (cmd === "reset") {
            const confirm = readlineSync.keyInYN('Are you sure you want to reset the plugins? This will delete all local modifications. Do you want to continue? ');
            if (!confirm) {
                log("Plugin reset canceled by the user.");
                return;
            }

            const pluginsPath = path.join(__dirname, '../lang/plugins');
            const localZipPath = path.join(__dirname, '../lang/default-plugins.zip');

            log("Deleting old plugins...");
            await fs.emptyDir(pluginsPath);

            log("Reading original package from local storage...");
            if (!await fs.pathExists(localZipPath)) {
                throw new Error(`Local zip file not found at: ${localZipPath}`);
            }
            const buffer = await fs.readFile(localZipPath);
            log("Extracting plugins...");
            const zip = new AdmZip(buffer);
            const zipEntries = zip.getEntries();
            zipEntries.forEach(entry => {
                if (!entry.isDirectory) {
                    const destPath = path.join(pluginsPath, entry.entryName);
                    fs.ensureDirSync(path.dirname(destPath));
                    fs.writeFileSync(destPath, entry.getData());
                }
            });

            log("Success! Plugins have been reset to the default version.");
        }
        else { throw new Error(`Unknown function type ${cmd}, use list/info/install/add/remove.`) }
    }
    catch (err) {
        log(`Could not execute plugins function: ${err}`, "ERR");
        process.exit(1);
    }
}

module.exports = pluginsFun;
