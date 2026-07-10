import pc from 'picocolors';
import config from '../../config.js';
import os from 'os';

export function showBanner() {
  const ascii = `
${pc.cyan("███████╗██╗  ██╗██╗   ██╗██╗     ██╗ ██████╗ ██╗  ██╗████████╗")}
${pc.cyan("██╔════╝██║ ██╔╝╚██╗ ██╔╝██║     ██║██╔════╝ ██║  ██║╚══██╔══╝")}
${pc.cyan("███████╗█████╔╝  ╚████╔╝ ██║     ██║██║  ███╗███████║   ██║   ")}
${pc.cyan("╚════██║██╔═██╗   ╚██╔╝  ██║     ██║██║   ██║██╔══██║   ██║   ")}
${pc.cyan("███████║██║  ██╗   ██║   ███████╗██║╚██████╔╝██║  ██║   ██║   ")}
${pc.cyan("╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ")}
                     ${pc.bold(pc.white("S k y L i g h t"))}
  `;

  console.clear();
  console.log(ascii);
  console.log(pc.gray('─'.repeat(63)));
  console.log(`${pc.cyan('●')} ${pc.bold('Framework:')} SkyLight (Lite Core)`);
  console.log(`${pc.cyan('●')} ${pc.bold('Version:')}   v${config.version}`);
  console.log(`${pc.cyan('●')} ${pc.bold('Engine:')}    Node.js ${process.version}`);
  console.log(`${pc.cyan('●')} ${pc.bold('OS:')}        ${os.type()} (${os.arch()})`);
  console.log(`${pc.cyan('●')} ${pc.bold('Prefix:')}    "${config.prefix}"`);
  console.log(`${pc.cyan('●')} ${pc.bold('Auth Mode:')} ${config.pairing.enabled ? pc.yellow('Pairing Code') : pc.green('QR Code')}`);
  console.log(pc.gray('─'.repeat(63)));
}
