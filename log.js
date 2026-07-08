function log(msg, type = "LOG") {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('pt-BR', { hour12: false });

    const reset = "\x1b[0m";
    const white = "\x1b[37m";
    const yellow = "\x1b[33m";
    const red = "\x1b[31m";
    const gray = "\x1b[36m";
    const green = "\x1b[32m";

    let color;
    let label;

    switch (type.toUpperCase()) {
        case 'WARN':
            color = yellow;
            label = "AMML WARN";
            break;
        case 'ERR':
            color = red;
            label = "AMML ERR";
            break;
        case 'DEBUG':
            color = green;
            label = "DEBUG";
            break;
        case 'LOG':
        default:
            color = white;
            label = "AMML LOG";
            break;
    }

    const msgStr = `${gray}[${timestamp}]${reset} ${color}[${label}] ${msg}${reset}`;
    if (type == "ERR") { console.error(msgStr) }
    else { console.log(msgStr) }
}

module.exports = log