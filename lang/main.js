const log = require("../log.js");
const parseCode = require("./parser.js");
const resolveTags = require("./tagsResolver.js");
const fs = require("fs-extra");
const path = require("path");

class Amml {
    constructor(configs = {}) {
        const settings = {
            format: typeof configs.format === "string" ? configs.format : "html",
            reqVersion: typeof configs.reqVersion === "string" ? configs.reqVersion : "any",
            debug: typeof configs.debug === "boolean" ? configs.debug : false,
            mode: typeof configs.mode === "string" ? configs.mode : "any",
            strict: typeof configs.strict === "boolean" ? configs.strict : false,
            skipHtmlCheck: typeof configs.skipHtmlCheck === "boolean" ? configs.skipHtmlCheck : false,
            skipXmlCheck: typeof configs.skipXmlCheck === "boolean" ? configs.skipXmlCheck : false,
            _tml: typeof configs._tml === "boolean" ? configs._tml : true
        }

        this.settings = Object.freeze(settings);
    }

    async compile(code = "", scriptPath = "none") {
        if (scriptPath === "none") { scriptPath = path.resolve(path.join(process.cwd(), "master.amml")) }
        if (this.settings._tml) log("Starting compilation for AMML code.");
        const data = fs.readJSONSync(path.join(__dirname, "../", "package.json"));
        const start = performance.now();
        try {
            if (this.settings.reqVersion !== "any") { if (this.settings.reqVersion !== data.version) { throw new Error(`Incompatible version error. Current version: ${data.version}; Required version: ${this.settings.reqVersion}`) } }
            if (this.settings.strict) { log("Executing as a strict environment, some plugins and features may not work.", "WARN") }
            const result = await resolveTags(code, this.settings, scriptPath);
            const codeWthSpecials = result.codeWthSpecials;
            const metadata = result.metadata;
            if (metadata.version !== "any") { if (metadata.version !== data.version) { throw new Error(`Incompatible script version error. Current version: ${data.version}; Required script version: ${metadata.version}`) } }
            const parsedCode = parseCode(codeWthSpecials, this.settings, metadata);
            const end = performance.now();
            const time = (end - start).toFixed(2);
            if (this.settings._tml) log(`Compilation finished with exit code 0. (${time}ms)`);
            return {
                code: `${this.settings.format === "json" ? JSON.stringify(parsedCode).trimStart().trimEnd() : parsedCode.trimStart().trimEnd()}`,
                ext: `.${this.settings.format}`
            }

        } catch (err) {
            if (this.settings._tml == true) {
                log(`${err}`, "ERR");
                log("Compilation finished with exit code 1.");
                process.exit(1);
            }
            else { throw new Error(err.message) }
        }
    }

    async compileFile(filePath, outFilePath) {
        try {
            const pth = path.resolve(path.join(process.cwd(), filePath))
            if (!await fs.exists(pth)) { throw new Error(`Reference error: file ${filePath} does not exist.`) }
            const stats = await fs.stat(pth);
            const ext = path.extname(pth);
            if (!stats.isFile) { throw new Error(`Reference error: file ${filePath} is not a file.`) }
            if (ext !== ".amml") { throw new Error(`Reference error: file ${filePath} is not a valid .amml file.`) }
            const content = await fs.readFile(pth, "utf-8");
            const result = await this.compile(content, pth);
            if (!outFilePath) { outFilePath = filePath.replace(/\.amml$/, result.ext) }
            const outPth = path.resolve(path.join(process.cwd(), outFilePath));
            await fs.outputFile(outPth, result.code);
            if (this.settings._tml == true) log(`Wrote file ${outPth}.`);
        } catch (err) {
            if (this.settings._tml == true) {
                log(`${err}`, "ERR");
                log("Compilation finished with exit code 1.");
                process.exit(1);
            }
            else { throw new Error(err.message) }
        }
    }
}

module.exports = Amml;