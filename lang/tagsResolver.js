const fs = require('fs-extra');
const path = require('path');
const log = require("../log.js");

async function resolveTags(code, settings, scriptPath) {
    const debug = msg => { if (settings.debug) log(msg, "DEBUG") }
    debug("Compiling code to XML")
    debug("\t├─ Resolving special tags");
    const specialTags = [];
    const metaTags = [];
    const ignorePattern = `#(?:<!).*|"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\``;
    
    // ALTERADO: O grupo de aspas agora tem um '?' no final e o fechamento aceita '/' opcional
    const specialTagRegex = new RegExp(`${ignorePattern}|(<!([a-zA-Z0-9_\\-]+)(?::([a-zA-Z0-9_\\-]+))?\\s*\\(\\s*(?:"([^"]*)"|'([^']*)')?\\s*\\)\\s*\\/?\\s*>)`, "g");
    
    const metaTagRegex = new RegExp(`${ignorePattern}|(<!AMML(?:\\s+(\\d+\\.\\d+\\.\\d+))?(?:\\s+(?:"([^"]*)"|'([^']*)'|(module)))?\\s*>|<!AMML\\s+(?:"([^"]*)"|'([^']*)'|(module))\\s+(\\d+\\.\\d+\\.\\d+)\\s*>)`, "g");
    const strictMetaCheck = new RegExp(`^\\s*(?:${metaTagRegex.source})`);
    const pluginRegex = /^\/\*\*@plugin\s+([a-zA-Z]+)\*\//;
    const pluginsPath = path.join(__dirname, "plugins");
    let codeWthSpecials = code;
    let match;

    while ((match = specialTagRegex.exec(code)) !== null) {
        if (match && match[1]) {
            specialTags.push({
                func: match[2],
                option: match[3] || "none",
                value: match[4] || match[5] || "none", // Aqui já vai virar "none" automaticamente!
                line: match[1],
                index: match.index,
                length: match[1].length
            });
        }
    }

    debug("\t│  ├─ Executing plugins");
    let plugin = null;

    for (let i = specialTags.length - 1; i >= 0; i--) {
        let foundPlugin = false;
        const tag = specialTags[i];
        let replacement = "";
        const files = fs.readdirSync(pluginsPath);
        for (const file of files) {
            const fullPath = path.join(pluginsPath, file);
            const content = fs.readFileSync(fullPath, 'utf8');
            const match = content.match(pluginRegex);
            if (!match) { continue; }
            const pluginName = match[1];
            if (pluginName === tag.func) {
                foundPlugin = true;
                plugin = require(fullPath);
                if (typeof plugin.returnsCode !== "boolean") plugin.returnsCode = true;
                if (plugin.dependencies.requiresInternet == true) {
                    const checkInternet = require("../internet.js");
                    const hasInternet = checkInternet();
                    if (!hasInternet) { throw new Error(`Internal plugin error at plugin "${tag.func}": The plugin requires Internet, cannot use it offline.`) }
                }
                if (Array.isArray(plugin.dependencies.commands) && plugin.dependencies.commands.length > 0) {
                    const checkCommandExists = require("../commands.js");
                    for await (const command of plugin.dependencies.commands) {
                        const exists = checkCommandExists(command);
                        if (!exists) {
                            const query = `command ${command} download`;
                            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                            const hyperlink = `\u001b]8;;${searchUrl}\u001b\\Try searching it\u001b]8;;\u001b\\`;
                            throw new Error(`Internal plugin error at plugin "${tag.func}": The plugin requires the command ${command} witch is not installed.\n${hyperlink}`)
                        };
                    }
                }
                if (typeof plugin?.func === "function") {
                    try {
                        const context = {
                            tag: tag,
                            settings: settings,
                            scriptPath: scriptPath,
                            debug: (msg) => { debug(`\t│  │  ├─ [PLUGIN] ${msg}`) },
                            log: (msg, isWarn = false) => { log(`${settings.debug == true ? "\t│  │  ├─ " : ""}[PLUGIN] ${msg}`, `${isWarn ? "WARN" : "LOG"}`) },
                            error: (msg) => { throw new Error(`@nje/ ${msg}`) }
                        }
                        replacement = await plugin.func(context) || "#None";
                    } catch (err) {
                        if (err.message.startsWith("@nje/")) { throw new Error(`Plugin error at plugin "${tag.func}": ${err.message.slice(5)}`) }
                        else { throw new Error(`Internal plugin error: on plugins folder, ${settings.debug == true ? `the file ${file} was executed but threw` : "a file was found but occured"} a javascript error: \n${err}`) }
                    }
                } else {
                    throw new Error(`Internal plugin error: Reference error: on plugins folder, ${settings.debug == true ? `the file ${file} was executed but it` : "a file was found but it"} don't exports the func property correctly.\nCheck if uses "module.exports = { /*...*/ func: (tag, replacement, debug) => { /*...*/ } }"`);
                }
                break;
            }
        }
        if (foundPlugin === false) {
            throw new Error(`Reference error: plugin "${tag.func}" wasn't found at tag "${tag.line}"`);
        }

        const middle = plugin.returnsCode ? replacement : "";
        codeWthSpecials = codeWthSpecials.slice(0, tag.index) + middle + codeWthSpecials.slice(tag.index + tag.length);
    }

    debug("\t│  │  └─ Done.");
    debug("\t│  └─ Done.");
    debug("\t├─ Resolving metadata");

    if (!strictMetaCheck.test(code)) { throw new Error("Reference error: the metadata tag was not found in the AMML code, be sure it is the first instruction.") }
    while ((match = metaTagRegex.exec(code)) !== null) {
        if (match && match[1]) {
            const version = match[2] || match[5];
            const type = match[3] || match[4];
            metaTags.push({
                version: version || "any",
                programType: type || `${settings.mode !== "any" ? settings.mode : "master"}`,
                line: match[1],
                index: match.index,
                length: match[1].length
            });
        }
    }

    for (let i = metaTags.length - 1; i >= 0; i--) {
        const tag = metaTags[i];
        codeWthSpecials = codeWthSpecials.slice(0, tag.index) + codeWthSpecials.slice(tag.index + tag.length);
    }

    debug("\t└─ Done.");
    debug("");

    return { metadata: metaTags[0], codeWthSpecials: codeWthSpecials }
}

module.exports = resolveTags;