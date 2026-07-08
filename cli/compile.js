const log = require("../log.js");

async function compile() {
    try {
        const args = process.argv.slice(2);
        if (args.length === 0) { throw new Error('Missing argument: amml file path.') }

        const filePath = args[1];
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
        await ammlInstance.compileFile(filePath, options.out);
    } catch (err) {
        log(`${err}`, "ERR");
        log("Compilation finished with exit code 1.");
        process.exit(1);
    }
}

module.exports = compile;