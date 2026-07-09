/**@plugin date*/
module.exports = {
    name: "Date info",
    version: "1.0.0",
    author: "AMML S. Plugins",
    license: "CC BY 4.0",
    supports: ["year", "month", "day", "hours", "seconds", "miliseconds"],
    description: "Returns a value about the date.",
    example: '<!date:hours())/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: (context) => {
        switch (context.tag.option) {
            case 'hours':
                return new Date().getHours();
            case 'day':
                return new Date().getDate();
            case 'seconds':
                return new Date().getSeconds();
            case 'miliseconds':
                return new Date().getMilliseconds();
            case 'month':
                return new Date().getMonth() + 1;
            case 'year':
                return new Date().getFullYear();
            default:
                context.error("Invalid option");
        }
    }
}
