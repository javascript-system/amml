/**@plugin repeat*/
module.exports = {
    name: "Values repeater",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Repeats a text a specified number of times.",
    supports: ["texts"],
    example: '<!repeat:2("<br/>")/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        const count = Number(context.tag.option);
        if (!Number.isInteger(count) || count < 0) { context.error(`Invalid repeat count "${context.tag.option}". Expected a positive integer.`) }
        return context.tag.value.repeat(count);
    }
};