/**@plugin UUD*/
module.exports = {
    name: "UUD Random",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Creates a random id based on the length selected.",
    supports: ["random", "length", "A-Z", "a-z", "0-9", "udd"],
    example: '//recomended to use inside script tag:\nconst id = "<!UUD:8()/>"',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        const { option } = context.tag;
        const length = option === "none" ? 8 : parseInt(option, 10);
        if (isNaN(length) || length <= 0) {
            context.error(`Invalid ID length: "${option}". The number must be greater than 0.`);
        }
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomId = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            randomId += chars.charAt(randomIndex);
        }

        return randomId;
    }
};