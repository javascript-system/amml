/**@plugin env*/
const os = require("os");
const path = require("path");

module.exports = {
    name: "Environment info",
    version: "1.0.0",
    author: "AMML S. plugins©",
    license: "CC BY 4.0",
    description: "Calculates a value from simple arithmetic operators (they include add, sub, div, mult and random), the numbers are separated by commas.",
    example: '<!env:platform()/>',
    returnsCode: true,
    dependencies: {
        requiresInternet: false,
        commands: []
    },
    func: (context) => {
        switch (context.tag.option) {
            case 'arch':
                return String(os.arch());
            case 'machine':
                return String(os.machine());
            case 'endianness':
                return String(os.endianness());
            case 'freemem':
                return String(os.freemem());
            case 'totalmem':
                return String(os.totalmem());
            case 'platform':
                return String(os.platform());
            case 'type':
                return String(os.type());
            case 'release':
                return String(os.release());
            case 'version':
                return String(os.version());
            case 'hostname':
                return String(os.hostname());
            case 'uptime':
                return String(os.uptime());
            case 'homedir':
                return String(os.homedir());
            case 'dirname':
                return String(path.resolve(context.scriptPath));
            case 'tmpdir':
                return String(os.tmpdir());
            case 'networkInterface':
                return JSON.stringify(os.networkInterfaces());
            case 'sgetPriority':
                return String(os.getPriority());
            default:
                context.error("Unknown option");
        }
    }
}