#!/usr/bin/env node
const [, , command, ...args] = process.argv;
const log = require('./log.js');

switch (command) {
    case 'help':
    case '--help':
    case '-h':
        const help = require("./cli/help.js");
        help(args);
        break;

    case 'compile':
        const compile = require("./cli/compile.js");
        compile();
        break;

    case 'result':
        const result = require("./cli/result.js");
        result();
        break;

    case 'run':
        const run = require("./cli/run.js");
        run();
        break;

    case 'plugins':
        const pluginsFun = require("./cli/plugins.js");
        pluginsFun(args);
        break;

    case 'cache':
        const cache = require("./cli/cache.js");
        cache(args);
        break;

    default:
        if (typeof command === "undefined") {
            log("AMML v1.0.0, use 'help --commands' to see all the commands");
            return;
        }

        log(`Command "${command}" was not found, try using "help" to see the commands list.`, "ERR");
}