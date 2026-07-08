const log = require("../log.js");
const fs = require("fs-extra");
const path = require("path");

async function result() {
    try {
        const args = process.argv.slice(2);
        if (args.length === 0) { throw new Error('Missing argument: amml file path.') }

        const filePath = args[1];
        const pth = path.resolve(path.join(process.cwd(), filePath));
        if (!await fs.exists(pth)) { throw new Error(`Reference error: file ${pth} does not exist.`) }
        const stats = await fs.stat(pth);
        const ext = path.extname(pth);
        if (!stats.isFile) { throw new Error(`Reference error: file ${pth} is not a file.`) }
        if (ext !== ".amml") { throw new Error(`Reference error: file ${pth} is not a valid .amml file.`) }
        const content = await fs.readFile(pth, "utf-8");
        
        const options = {};
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--')) {
                const key = arg.slice(2);
                const nextArg = args[i + 1];
                if (nextArg && !nextArg.startsWith('--')) { options[key] = nextArg; i++ } else { options[key] = true }
            }
        }

        const configs = {
            format: typeof options.format === "string" ? options.format : "html",
            reqVersion: typeof options.reqV === "string" ? options.reqV : "any",
            debug: options.debug ? true : false,
            mode: typeof options.mode === "string" ? options.mode : "any",
            strict: options.strict ? true : false,
            skipHtmlCheck: options.skipHtmlCheck ? true : false,
            skipXmlCheck: options.skipXmlCheck ? true : false,
            _tml: true
        };

        const Amml = require("../lang/main.js");
        const ammlInstance = new Amml(configs);
        const output = await ammlInstance.compile(content, pth);
        log("File result:");
        console.log("");
        console.log("");
        console.log(`${output.code.trimStart().trimEnd()}`);
    } catch (err) {
        log(`${err}`, "ERR");
        log("Compilation finished with exit code 1.");
        process.exit(1);
    }
}

module.exports = result;