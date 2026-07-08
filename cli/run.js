const fs = require("fs-extra");
const path = require("path");
const log = require("../log");
const http = require("http");

async function run() {
    let appData = { name: "site", version: "1.0.0", description: "Site made with amml", author: "unknown", main: "index.amml" };
    try {
        const args = process.argv.slice(2);
        if (!args[0]) { throw new Error('Missing argument: amml file path.') }
        const folderPath = args[1];
        let runtimeMode = "browser";
        if (args.includes("--browser")) runtimeMode = "browser";
        if (args.includes("--server")) runtimeMode = "server";
        const pth = path.resolve(path.join(process.cwd(), folderPath));
        if (!await fs.exists(pth)) { throw new Error(`Reference error: folder ${pth} does not exist.`) }
        const stats = await fs.stat(pth);
        if (stats.isFile()) { throw new Error(`Reference error: the path ${pth} is not a folder.`) }
        const content = await fs.readdir(pth);
        if (content.includes("amml.configs.json")) {
            const jsonPth = path.resolve(path.join(pth, "amml.configs.json"));
            const data = await fs.readJson(jsonPth);

            if (typeof data.main !== "string") { throw new Error("Invalid json content: the \"main\" config is not a valid string") }
            appData = data;
        }
        else {
            const possibleNames = ["index.amml", "main.amml", "master.amml", "app.amml"];
            const mainsFound = content.filter(file => possibleNames.includes(file));
            if (mainsFound.length == 1) {
                const file = mainsFound[0];
                const mainPth = path.resolve(path.join(pth, file));
                appData.main = mainPth;
            }
            else if (mainsFound.length > 1) { throw new Error(`It's impossible to opperate with multiple possible main files, found: ${mainsFound.join(', ')}`) }
            else { throw new Error("The main file wasn't found in the folder, try using a common index.amml file name or creating a amml.configs.json with the \"main\" config.") }
        }

        let options = appData.compilation || {};
        const configs = {
            format: "html",
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
        const code = await fs.readFile(appData.main, "utf-8");
        const output = await ammlInstance.compile(code, appData.main);
        const runtimeDir = path.resolve(__dirname, "../.runtime");
        await fs.ensureDir(runtimeDir);

        const htmlPath = path.join(runtimeDir, "index.html");
        await fs.writeFile(htmlPath, output.code, "utf-8");

        if (runtimeMode === "browser") {
            log("Opening project directly in browser...", "INFO");
            const { default: open } = await import("open");
            await open(htmlPath);
        }

        else if (runtimeMode === "server") {
            const { default: open } = await import("open");
            const PORT = process.env.PORT || 3000;
            const server = http.createServer(async (req, res) => {
                try {
                    if (req.url === "/" || req.url === "/index.html") {
                        const htmlContent = await fs.readFile(htmlPath, "utf-8");
                        res.writeHead(200, { "Content-Type": "text/html" });
                        res.end(htmlContent);
                    } else {
                        res.writeHead(404, { "Content-Type": "text/plain" });
                        res.end("Not Found");
                    }
                } catch (serverErr) {
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.end(`Internal Server Error: ${serverErr.message}`);
                }
            });

            server.listen(PORT, async () => {
                log(`Server running at http://localhost:${PORT}/`);
                await open(`http://localhost:${PORT}`);
                const readline = require("readline");
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                log("Type 'kill' at any time to stop the server.");
                rl.on("line", (input) => {
                    if (input.trim().toLowerCase() === "kill") {
                        log("Shutting down server...");
                        rl.close();
                        server.close()
                        log("Server stopped successfully. Exiting code 0.");
                        process.exit(0);
                    }
                });
            });
        }

    } catch (err) {
        log(`${err.stack || err}`, "ERR");
        log("Compilation finished with exit code 1.");
        process.exit(1);
    }
}

module.exports = run;