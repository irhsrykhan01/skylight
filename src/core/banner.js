import pc from 'picocolors';
import config from '../../config.js';
import os from 'os';

export function showBanner() {
  // Banner ASCII orisinal bertema SkyLight
  const ascii = `
   ${pc.cyan("   _____ __       __    _ __      __    _ ")}
   ${pc.cyan("  / ___// /_____ _/ /   (_) /_  __/ /_  (_) ")}
   ${pc.cyan("  \\__ \\/ //_/ __ `/ /   / / / / / / __ \\/ /  ")}
   ${pc.cyan(" ___/ / ,< / /_/ / /___/ / / /_/ / / / / /   ")}
   ${pc.cyan("/____/_/|_|\\__, /_____/_/_/\\__, /_/ /_/_/    ")}
   ${pc.cyan("          /____/          /____/            ")}
  `;

  console.clear();
  console.log(ascii);
  console.log(pc.gray('─'.repeat(55)));
  console.log(`${pc.cyan('●')} ${pc.bold('Framework:')} SkyLight (Lite Core)`);
  console.log(`${pc.cyan('●')} ${pc.bold('Version:')}   v${config.version}`);
  console.log(`${pc.cyan('●')} ${pc.bold('Engine:')}    Node.js ${process.version}`);
  console.log(`${pc.cyan('●')} ${pc.bold('OS:')}        ${os.type()} (${os.arch()})`);
  console.log(`${pc.cyan('●')} ${pc.bold('Prefix:')}    "${config.prefix}"`);
  console.log(`${pc.cyan('●')} ${pc.bold('Auth Mode:')} ${config.pairing.enabled ? pc.yellow('Pairing Code') : pc.green('QR Code')}`);
  console.log(pc.gray('─'.repeat(55)));
}
