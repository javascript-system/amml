const util = require("util");
const log = console.log;
const br = () => console.log("");
const sign = (msg) => { const length = msg.length; const char = "-"; const bar = char.repeat(length); console.log(`${bar}\n${msg}\n${bar}`) }

function language() {
    log("Below you can see how to use the language:");
    br();
    sign("AMML LANGUAGE SUPPORT");
    log("• Syntax: AMML simplifies HTML by using XML-based syntax to assist the parser. Therefore, self-closing tags like <br/> must be strictly closed.");
    br();
    log("• Special Tags: These tags use the structure <!plugin:option(\"value\")/> to call plugins and replace them with executed content.");
    log("  Example: <!element:src(\"file.amml\")/>. Options and values are optional depending on the plugin.");
    br();
    log("• Metadata Tag: Unlike HTML's static <!DOCTYPE html>, this tag performs a real setup using the structure <!AMML (vmVersion) (programType)>.");
    log("  Example: <!AMML 1.0.0 \"master\">.");
    br();
    log("• Code Structure: If your output format is JSON or XML, the structure will be simple data-based code. If you are using HTML, there are 3 file types available:");
    br();
    log("  1. master: Coordinates everything and wraps your code in real HTML using two main tags: <window/> and <interface>. The <interface> tag contains the content to be displayed, while <window/> configures page metadata. Example: <window charset=\"utf-8\" lang=\"en-us\" title=\"Page\" iconSrc=\"icon.png\"/>. Note: Use 'iconSrc' for local files and 'iconHref' for URLs.");
    br();
    log("  2. component: Works like a master file, but is strictly restricted to the <interface> tag to define a raw HTML element.");
    br();
    log("  3. module: Defines JavaScript and CSS content for the page, generating standard <script>, <style>, and <link/> HTML tags. Use <javascript> or <css> for raw internal code, or <file src=\"file.js\"/> (or href for styles) to link external files.");
}

function commands(isCmd = false) {
    if (isCmd) { log("Below you can see the cli commands:"); br() };
    sign("AMML COMMANDS LIST");
    log("Running commands:")
    log("• amml run <folder path> <--browser/--server (optional)> -> opens the local compiled file/server of a amml project, you can use a configs.json to configure the compilation.");
    br();
    log("• amml compile <file> <options> -> compiles a .amml file to html/xml/json, options: [--debug, --strict, --skipHtmlCheck, --skipXmlCheck, --format \"html/json/xml\", --reqV \"string\" --mode \"string\", --out \"path\"].");
    br();
    log("• amml result -> same as compile, but instead of saving the file, pastes the result on the terminal.");
    br();
    log("Cache commands:");
    log("• amml cache clear -> erases all the stored cache.");
    br();
    log("• amml cache add -> adds a URL to the cache with a text input");
    br();
    log("• amml cache list -> lists all the URLs in cache");
    br();
    log("Plugins commands:");
    log("• amml plugins reset -> resets all the plugins to the default libs on the official github repository.");
    br();
    log("• amml plugins add <filePath> -> adds a local.js file on the plugins folder, recomended for developing and tests.");
    br();
    log("• amml plugins install -> adds a plugin via URL with a text input.");
    br();
    log("• amml plugins remove <name/file/URL> -> erases a required plugin from the plugins folder.");
    br();
    log("• amml plugins info <name/file/URL> <--function (optional)> -> gives information about a selected plugin; If --function is used, gives the function code too.");
    br();
    log("• amml plugins doctor <name/file/URL> -> provides a report about the structure of a plugin's code.");
    br();
    log("• amml plugins list -> gives a list of all the plugins installed.");
}

function plugins(isPlugin = false) {
    const ex = {
        name: "Decorated name",
        version: "Plugin version",
        description: "Plugin description",
        author: "Complete name",
        example: "<!plugin(\"make something\")/>",
        supports: ["files", "TypeScript", "cache"],
        returnsContent: true,
        dependencies: {
            requiresInternet: false,
            commands: ["tsc", "npm"]
        },
        func: (_context) => { }
    };

    const contextApi = 
`context: {
    tag: {
        option: string | "none";
        value: string | "none";
    };
    settings: {
        format: "html" | "xml" | "json";
        reqVersion: string;
        debug: boolean;
        mode: string | "any";
        strict: boolean;
        skipHtmlCheck: boolean;
        skipXmlCheck: boolean;
        _tml: boolean;
    };
    scriptPath: string;
    debug: (msg: string) => void;
    log: (msg: string, isWarn?: boolean) => void;
    error: (msg: string) => void;
};`;

    if (isPlugin) { log("Below you can see how to make plugins:"); br() };
    sign("PLUGINS GUIDE");
    log("Creating plugins is simple, every plugin can make somethin on it's execution, returning or not text, to make them, you need to folow this simple steps:");
    br();
    log("1. Create your .js/.cjs file, and in the first line, use \"**@plugin <name>*/\" for the compiler to find your file, without it, it's treated as a disabled file.");
    br();
    log("2. Write a module.exports = {}, containing an object with the information:");
    log(util.inspect(ex, { colors: true, depth: null }));
    br();
    log("3. Make a great func using debugs, errors, and return in case of returnsContent being true on the module, and great usage context api, it includes:");
    log(contextApi);
    br();
    log("4. When ready, you can test your plugin with \"amml plugins add myPlugin.js\", and create a code for test it.");
    br();
    log("5. To publish is simple, put it in any website, like github, and anyone can use \"amml plugins install \"https://my-link.com/path/plugin.js\"\"");
}

function help(args) {
    let mode = "complete";
    if (args[0] == "--commands") mode = "commands";
    if (args[0] == "--language") mode = "language";
    if (args[0] == "--plugins") mode = "plugins";
    log("AMML v1.0.0 help.");
    br();
    log("AMML (Advanced Modular Markup Language) is a markup language designed to enhance standard HTML structure and organization.");
    log("This CLI provides features to organize your project, including new plugins, commands, a simple syntax, and other tools.");
    if (mode === "language") language();
    if (mode === "commands") commands(true);
    if (mode === "plugins") plugins(true);
    if (mode === "complete") { language(); br(); br(); commands(); br(); br(); plugins(); }
}

module.exports = help;