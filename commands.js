const { spawnSync } = require('child_process');

function isCommandAvailable(command) {
  const isWindows = process.platform === 'win32';
  const bin = isWindows ? `${command}.exe` : command;
  const args = ['--version'];

  try {
    const result = spawnSync(bin, args, { shell: true });
    return result.status === 0;
  } catch (error) {
    return false;
  }
}

module.exports = isCommandAvailable;