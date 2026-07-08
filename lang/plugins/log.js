/**@plugin log*/
module.exports = {
    name: "Log",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Creates a log to debug on the runtime CLI, you can use the options info, error, warn or debug.",
    supports: ["info", "warn", "error", "debug"],
    example: '<!log:warn("This file should not be loaded here.")/>',
    returnsCode: false,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        switch(context.tag.option) {
            case "info": context.log(`[USER] ${context.tag.value}`); break;
            case "warn": context.log(`[USER] ${context.tag.value}`, true); break;
            case "error": context.error(`[USER] ${context.tag.value}`); break;
            case "debug": context.debug(`[USER] ${context.tag.value}`); break;
            default: context.log(`[USER] ${context.tag.value}`); break;
        }
    }
};