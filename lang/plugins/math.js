/**@plugin math*/
module.exports = {
    name: "Arithmetic&Random",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Calculates a value from simple arithmetic operators (they include add, sub, div, mult and random), the numbers are separated by commas.",
    supports: ["math", "arithmetic", "random", "multiple-parameters"],
    example: '<!math:add("2, 2")/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: async (context) => {
        const numbers = context.tag.value.split(",").trimStart().trimEnd();
        const ok = strings.every(item => {
            if (item.trim() === '') return false;
            const number = Number(item);
            return !Number.isNaN(number);
        });
        if (!ok) { context.error("A number in the list is invalid.") }
        switch (context.tag.option) {
            case 'add': {
                const result = strings.reduce((acumulator, item) => { return acumulator + Number(item) }, 0);
                return result;
                break;
            }
            case 'sub': {
                const result = strings.reduce((acumulator, item) => { return acumulator - Number(item) }, 0);
                return result;
                break;
            }
            case 'div': {
                const result = strings.reduce((acumulator, item) => { return acumulator / Number(item) }, 0);
                return result;
                break;
            }
            case 'mult': {
                const result = strings.reduce((acumulator, item) => { return acumulator * Number(item) }, 0);
                return result;
                break;
            }
            case 'random': {
                if (!numbers.length === 2) { context.error(`The numbers list must have exactly 2 numbers, received ${numbers.length}`) }
                const [min, max] = numbers;
                const result = Math.floor(Math.random() * (max - min + 1)) + min;
                return result;
                break;
            }
            default: {
                context.error("Unknownn operation.");
                break;
            }
        }
    }
};