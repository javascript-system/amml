/**@plugin decode*/
module.exports = {
    name: "Decode base64/uri",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Decodes a base64 or uri key to text.",
    supports: ["text", "base64", "uri"],
    example: '<!decode:base64("SGVsbG8gV29ybGQh")/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        const { option, value } = context.tag;

        if (option === "none" || option === "base64") {
            return Buffer.from(value, 'base64').toString('utf8');
        } 
        
        if (option === "uri" || option === "url") {
            return decodeURIComponent(value);
        }

        context.error(`Invalid decoding option: "${option}". Use "base64" or "uri".`);
    }
};