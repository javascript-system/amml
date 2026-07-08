const log = require("../log.js");
const fs = require("fs-extra");
const path = require("path");

async function cache(args) {
    const cacheDir = path.resolve(path.join(__dirname, "../", ".cache"))
    try {
        if (!args[0]) throw new Error("Missing argument: cache func.");
        const cmd = args[0];
        if (cmd === "clear") {
            await fs.emptyDir(cacheDir);
            log("Cache removed.");
        }
        else if (cmd === "list") {
            const cached = await fs.readdir(cacheDir);
            log("Cached items:");
            let used = false
            for await (const item of cached) {
                used = true;
                console.log(`https://${item.replaceAll("$SLASH", "/")}`);
            }
            if (!used) { console.log("None") }
        }
        else if (cmd === "add") {
            const input = require('readline-sync').question;
            const url = input("Insert an URL to download to the cache:\n");
            const checkInternet = require("../internet.js");
            const hasInternet = await checkInternet();
            let compUrl = `${url.startsWith("https://") ? "" : "https://"}${url}`;
            const safeName = compUrl.replace(/^https?:\/\//, '').replace(/\//g, '$SLASH');
            const cachePath = path.join(cacheDir, safeName);
            let code = null;
            if (hasInternet) {
                const fetchHref = require("../fetch.js");
                try {
                    code = await fetchHref(compUrl, false);
                    await fs.ensureDir(cacheDir);
                    await fs.outputFile(cachePath, code);
                    log(`Fetch successful, updated cache.`);
                } catch (err) {
                    throw new Error(`Fetch failed: ${err.message}.`);
                }
            }
            else { throw new Error(`Impossible to fetch: No internet.`) }
        }
        else { throw new Error(`Unknown function type ${cmd}, use list/clear/add.`) }
    } catch (err) {
        log(`Could not execute cache function: ${err}`, "ERR");
        process.exit(1);
    }
}

module.exports = cache;