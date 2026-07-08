/**@plugin encode*/
module.exports = {
    name: "Encode base64/uri",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Encodes a text to base64, or uri.",
    supports: ["text", "base64", "uri"],
    example: '<!encode:base64("hello, world!")/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        const { option, value } = context.tag;
        if (option === "none" || option === "base64") {
            return Buffer.from(value).toString('base64');
        }
        if (option === "uri" || option === "url") {
            return encodeURIComponent(value);
        }
        context.error(`Unknown encoding option: "${option}". Use "base64" or "uri".`);
    }
};