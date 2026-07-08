/**@plugin value*/
module.exports = {
    name: "Values paster",
    version: "1.0.0",
    author: "AMML S. Plugins",
    license: "CC BY 4.0",
    supports: ["text", "cache", "URLs", "src", "href", "node", "cjs"],
    description: "Inserts an value.",
    example: '<!value:src("value.html"))/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        if (context.tag.value == "none") { context.error("Empty tag value.") }
        if (context.tag.option == "none") { return context.tag.value }
        const path = require("path");
        switch (context.tag.option) {
            case 'node': {
                context.debug("Reading node CJS file");
                const fs = require("fs-extra");
                const pth = path.join(`${path.dirname(context.scriptPath)}`, context.tag.value);
                if (!await fs.exists(pth)) { context.error(`Requested path ${pth} doesn't exists.`) }
                const stats = await fs.stat(pth);
                if (!stats.isFile()) { context.error("Requested path is not a file.") }
                const value = require(pth);
                if (typeof value !== "string") { context.error("The returned value from the file is not a valid string.") }
                return value;
                break;
            }
            case 'src': {
                context.debug("Reading value file");
                const fs = require("fs-extra");
                const pth = path.join(`${path.dirname(context.scriptPath)}`, context.tag.value);
                if (!await fs.exists(pth)) { context.error(`Requested path ${pth} doesn't exists.`) }
                const stats = await fs.stat(pth);
                if (!stats.isFile()) { context.error("Requested path is not a file.") }
                const code = await fs.readFile(pth, "utf-8");
                return code;
                break;
            }
            case 'href': {
                if (context.tag.value.startsWith("http://")) { context.error("Security error: http links are insecure, execution interrupted.") }
                const url = `${context.tag.value.startsWith("https://") ? "" : "https://"}${context.tag.value}`
                context.debug(`Fetching value file from ${url}`);
                const fetchHref = require("../../fetch.js");
                let code;
                try { code = await fetchHref(url, false) } catch (err) { context.error(`An error occured while fetching the file ${url}: ${err.message}`) }
                let cleanPath;
                try { cleanPath = new URL(url).pathname } catch (_) { cleanPath = url; }
                return code
                break;
            }
            case 'text': {
                return context.tag.value;
                break;
            }
            default:
                context.error(`Unknown value type to insert "${context.tag.option}", use "src", "href", "node" or "text"`)
                break;
        }
    }
}