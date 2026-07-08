/**@plugin element*/
async function executeAmml(code, context) {
    try {
        context.debug("Executing module file");
        const Amml = require("../main.js");
        const ammlInstance = new Amml({ debug: false, reqVersion: context.settings.reqVersion, format: "html", mode: "component", _tml: false });
        context.debug(context.scriptPath)
        const result = await ammlInstance.compile(code, context.scriptPath);
        const interfaceRegex = /<interface[^>]*>([\s\S]*?)<\/interface>/;
        const match = result.code.match(interfaceRegex);
        if (match && match[1]) { return match[1].trim() }
        return result.code; 
    }
    catch (err) { context.error(`An error occured while executing the amml module "${context.tag.value}":\n${err}`); }
}

module.exports = {
    name: "Component",
    version: "1.0.0",
    author: "AMML S. Plugins",
    license: "CC BY 4.0",
    supports: ["text", "cache", "URLs", "src", "href"],
    description: "Inserts an element in somewhere.",
    example: '<!element:src("element.html"))/>',
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
            case 'src': {
                context.debug("Reading component file");
                const fs = require("fs-extra");
                const pth = path.join(`${path.dirname(context.scriptPath)}`, context.tag.value);
                if (!await fs.exists(pth)) { context.error(`Requested path ${pth} doesn't exists.`) }
                const stats = await fs.stat(pth);
                if (!stats.isFile()) { context.error("Requested path is not a file.") }
                const code = await fs.readFile(pth, "utf-8");
                const ext = path.extname(pth).toLowerCase();
                if (ext === ".amml") { return await executeAmml(code, context) }
                else { return (code) }
                break;
            }
            case 'href': {
                if (context.tag.value.startsWith("http://")) { context.error("Security error: http links are insecure, execution interrupted.") }
                const url = `${context.tag.value.startsWith("https://") ? "" : "https://"}${context.tag.value}`
                context.debug(`Fetching component file from ${url}`);
                const fetchHref = require("../../fetch.js");
                let code;
                try { code = await fetchHref(url, false) } catch (err) { context.error(`An error occured while fetching the file ${url}: ${err.message}`) }
                let cleanPath;
                try { cleanPath = new URL(url).pathname } catch (_) { cleanPath = url; }
                const ext = path.extname(cleanPath).toLowerCase();
                if (ext === ".amml") { return await executeAmml(code, context) } else { return code }
            }
            case 'text': {
                return context.tag.value;
                break;
            }

            default:
                context.error(`Unknown element type to insert "${context.tag.option}", use "src", "href", or "text"`)
                break;
        }
    }
}