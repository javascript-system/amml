const log = require("../log.js");
const { XMLParser, XMLValidator, XMLBuilder } = require('fast-xml-parser');
const { HtmlValidate } = require('html-validate');

function parseCode(code, settings, metadata) {
    debug = msg => { if (settings.debug) log(msg, "DEBUG") }
    debug("Parsing code");
    const compilerOptions = {
        ignoreAttributes: false,
        parseAttributeValue: true,
        parseTagValue: true,
        trimValues: false,
        preserveOrder: true,
        trimValues: true,
        allowBooleanAttributes: true,
        suppressEmptyNode: true,
        format: true,
        processEntities: false,
        indentBy: "\t"
    };

    if (!settings.skipXmlCheck) {
        const validated = XMLValidator.validate(`<?xml version="1.0" encoding="UTF-8"?><amml-root>${code}</amml-root>`);
        if (validated !== true) { throw new Error(`XML Error ${validated.err.code} at line ${validated.err.line}${typeof validated.err.col === "number" ? `, col${validated.err.col}` : ""}:\n${validated.err.msg}`); }
    }

    const parser = new XMLParser(compilerOptions);
    let parsedCode = parser.parse(code);
    debug("\t├─ Generating output");

    if (settings.format === "json") {
        debug("\t│  ├─ Target: JSON");
        parsedCode = parsedCode;
        debug("\t│  └─ Done.");
    }

    else if (settings.format === "xml") {
        debug("\t│  ├─ Target: XML");
        const builder = new XMLBuilder(compilerOptions);
        parsedCode = builder.build(parsedCode);
        debug("\t│  └─ Done.");
    }

    else if (settings.format === "html") {
        debug("\t│  ├─ Target: HTML");
        let ammlWindowNode = null;
        let ammlInterface = null;
        if (Array.isArray(parsedCode)) {
            ammlWindowNode = parsedCode.find(node => node.window);
            ammlInterface = parsedCode.find(node => node.interface)?.interface;
        }

        debug("\t│  ├─ Building DOM structure");
        if (settings.mode !== "any") { if (metadata.programType !== settings.mode) { throw new Error(`Used program type "${metadata.programType}" but this execution can only use "${settings.mode}"`) } }

        const ammlAttrs = ammlWindowNode?.[":@"] || {};
        const pageTitle = ammlAttrs?.["@_title"] || "AMML Application";
        const pageCharset = ammlAttrs?.["@_charset"] || "utf-8";
        const pageLang = ammlAttrs?.["@_lang"] || "en-US";
        const pageIcon = ammlAttrs?.["@_iconSrc"] || ammlAttrs?.["@_iconHref"] || "";

        let interfaceChildren = ammlInterface || [];
        if (interfaceChildren && interfaceChildren[":@"]) { interfaceChildren = interfaceChildren.slice(1); }
        if (interfaceChildren.length === 0) { interfaceChildren = [{ "#text": "" }]; }
        let htmlDom = {};
        switch (metadata.programType) {
            case 'master': {
                debug("\t│  ├─ Building document for master file");
                if (!ammlInterface) { throw new Error("Compiler error: Necessary tag <interface> for type \"master\" not found in code.") }
                htmlDom = [{
                    "html": [
                        {
                            "head": [
                                { "title": [{ "#text": pageTitle }] },
                                { "meta": [], ":@": { "@_charset": pageCharset } },
                                ...(pageIcon ? [{ "link": [], ":@": { "@_rel": "icon", "@_href": pageIcon, "@_type": "image/x-icon" } }] : [])
                            ]
                        },
                        {
                            "body": interfaceChildren
                        }
                    ],
                    ":@": { "@_lang": pageLang }
                }];
                break;
            }

            case 'component': {
                debug("\t│  ├─ Building document for component file");
                if (ammlWindowNode) { throw new Error("Compiler error: Used incompatible tag <window/> in type \"component\".") }
                if (!ammlInterface) { throw new Error("Compiler error: Necessary tag <interface> for type \"component\" not found in code.") }
                htmlDom = interfaceChildren;
                break;
            }

            case 'module': {
                debug("\t│  ├─ Building document for module file");
                if (ammlWindowNode) { throw new Error("Compiler error: Used incompatible tag <window/> in type \"module\".") }
                if (ammlInterface) { throw new Error("Compiler error: Used incompatible tag <interface> in type \"module\".") }
                let moduleChildren = [];
                for (let node of parsedCode) {
                    const tagName = Object.keys(node).find(k => k !== ":@");
                    if (!tagName) {
                        moduleChildren.push(node);
                        continue;
                    }

                    const attrs = node[":@"] || {};
                    let newNode = {};

                    if (tagName === "javascript") {
                        newNode["script"] = (!node[tagName] || node[tagName].length === 0) ? [{ "#text": "" }] : node[tagName];
                        newNode[":@"] = attrs;
                    } else if (tagName === "css") {
                        newNode["style"] = (!node[tagName] || node[tagName].length === 0) ? [{ "#text": "" }] : node[tagName];
                        newNode[":@"] = attrs;
                    } else if (tagName === "file") {
                        const src = attrs["@_src"];
                        const href = attrs["@_href"];

                        const isCss = (href && href.endsWith(".css")) || (src && src.endsWith(".css"));

                        if (isCss) {
                            newNode["link"] = [];
                            newNode[":@"] = { ...attrs, "@_rel": "stylesheet" };
                            if (src && !href) {
                                newNode[":@"]["@_href"] = src;
                                delete newNode[":@"]["@_src"];
                            }
                        } else {
                            newNode["script"] = [{ "#text": "" }];
                            newNode[":@"] = { ...attrs };
                            if (href && !src) {
                                newNode[":@"]["@_src"] = href;
                                delete newNode[":@"]["@_href"];
                            }
                        }
                    } else {
                        newNode[tagName] = node[tagName];
                        if (node[":@"]) newNode[":@"] = attrs;
                    }
                    moduleChildren.push(newNode);
                }

                htmlDom = [{
                    "div": moduleChildren
                }];
                break;
            }

            default: {
                throw new Error(`Unknown program type "${metadata.programType}" at metadata tag, be sure to use "master", "component", or "module".`);
            }
        }

        const builder = new XMLBuilder(compilerOptions);
        let builtHtml = builder.build(htmlDom);
        builtHtml = builtHtml.replace('<body/>', '<body></body>');
        builtHtml = builtHtml.replace(/<script([^>]*)\/>/g, '<script$1></script>');
        builtHtml = builtHtml.replace(/<style([^>]*)\/>/g, '<style$1></style>');
        parsedCode = `${metadata.programType === "master" ? "<!DOCTYPE html>\n" : ""}${builtHtml}`;
        const activeRules = {
            "void-style": ["error", { style: "selfclose" }],
            "no-trailing-whitespace": "off",
            "script-type": "off",
            "element-permitted-content": "off",
            "no-implicit-button-type": "off"
        };
        debug("\t│  ├─ Validating HTML");
        const htmlvalidate = new HtmlValidate({
            extends: ["html-validate:recommended"],
            rules: activeRules
        });
        if (!settings.skipHtmlCheck) {
            const report = htmlvalidate.validateStringSync(parsedCode);
            if (!report.valid) {
                const messages = report.results ? report.results.flatMap(r => r.messages || []) : [];
                const err = messages[0];
                if (err) {
                    throw new Error(`HTML Error ${err.ruleId} at line ${err.line}, col ${err.column}:\n${err.message}`);
                }
            }
        }
        debug("\t│  └─ Done.");
    }


    else {
        throw new Error(`Internal error: unknown output file format ${type}, try using json, xml or html.`);
    }
    debug("\t└─ Done.");
    return parsedCode;
}

module.exports = parseCode;